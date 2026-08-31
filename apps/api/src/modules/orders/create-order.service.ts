/**
 * Order service — orchestrates repository + branch/table validation +
 * pricing (PricingPipeline) + status transitions (order-status.machine.ts)
 * + inventory deduction + event publishing. This is the module's biggest
 * service by a wide margin because order creation genuinely touches the
 * most other subsystems (menu, tables, branches, kitchen tickets,
 * inventory) — that breadth is inherent to the domain, not something a
 * file split alone fixes.
 */
import type { KitchenTicket, Order, OrderType, RestaurantTable } from "@pos/types";
import type { AuthContext } from "../../core/auth";
import { requireOrdersPermission } from "./orders-authorization";
import { DomainRuleError, ValidationError } from "../../core/errors";
import { availabilityRepository } from "../menu/availability/availability.repository";
import { tableRepository } from "../tables/table.repository";
import { branchRepository } from "../branches/branch.repository";
import { inventoryService } from "../inventory/inventory.service";
import { eventBus } from "../../lib/event-bus";
import { orderRepository } from "./order.repository";
import { assertCourseSequencingAllowed, assertInitialCourseSequence, assertItemsInSchedule } from "./order-fire.helpers";
import {
  pricingPipeline,
  type OrderItemInput,
  type PricableMenuItem,
  type PricedLine,
} from "./pricing/pricing-pipeline";
import { snapshotOrderLines } from "./order-line-snapshot.service";
import {
  priceComboOrders,
  type ComboOrderSelection,
} from "../menu/combos/combo-order.service";
import { customerGroupRepository } from "../customer-groups/customer-group.repository";
import { metrics } from "../../core/observability/metrics";
import {
  branchRequiredForOrder,
  orderBranchNotFound,
  orderTypeDisabled,
  tableRequiredForDineIn,
  orderTableNotFound,
  tableOccupied,
} from "./order.errors";

// Maps an order type to the branch column that gates it. The UI filters
// the type selector to what's enabled as a convenience, but this map is
// the actual guarantee — it's checked here regardless of what the
// frontend sent, since someone could hit the API directly.
const ORDER_TYPE_CAPABILITY_FIELD: Record<
  OrderType,
  "dineInEnabled" | "takeawayEnabled" | "deliveryEnabled" | "onlineEnabled"
> = {
  DINE_IN: "dineInEnabled",
  TAKEAWAY: "takeawayEnabled",
  DELIVERY: "deliveryEnabled",
  ONLINE: "onlineEnabled",
};

export interface CreateOrderInput {
  type: OrderType;
  tableId?: string | undefined;
  customerId?: string | undefined;
  customerGroupId?: string | undefined;
  billingMode?: "LINE_ITEMS" | "PER_COVER" | undefined;
  coverCount?: number | undefined;
  perCoverPriceRuleId?: string | undefined;
  notes?: string | undefined;
  couponCode?: string | undefined;
  promotionIds?: string[] | undefined;
  items?: OrderItemInput[] | undefined;
  combos?: ComboOrderSelection[] | undefined;
}

export const createOrderService = {
  async create(auth: AuthContext, input: CreateOrderInput) {
    requireOrdersPermission(auth, "orders:create");
    const branchId = auth.branchId;
    if (!branchId) throw branchRequiredForOrder();

    const branch = await branchRepository.findById(auth.tenantId, branchId);
    if (!branch) throw orderBranchNotFound();

    const capabilityField = ORDER_TYPE_CAPABILITY_FIELD[input.type];
    if (!capabilityField || !branch[capabilityField]) {
      throw orderTypeDisabled();
    }

    if (input.type === "DINE_IN" && !input.tableId) {
      throw tableRequiredForDineIn();
    }

    // Dine-in orders tied to a table: make sure the table exists, belongs to
    // this branch, and isn't already occupied by another open order.
    if (input.type === "DINE_IN" && input.tableId) {
      const table = await tableRepository.findById(
        auth.tenantId,
        input.tableId,
      );
      if (!table || table.branchId !== branchId) {
        throw orderTableNotFound();
      }
      const alreadyOccupied = await tableRepository.hasOpenOrders(
        auth.tenantId,
        input.tableId,
      );
      if (alreadyOccupied) {
        throw tableOccupied();
      }
    }

    if (input.customerGroupId) {
      const customerGroup = await customerGroupRepository.findById(
        auth.tenantId,
        input.customerGroupId,
      );
      if (!customerGroup)
        throw new ValidationError(
          "Customer group does not belong to this tenant",
        );
    }

    const billingMode = input.billingMode ?? "LINE_ITEMS";
    if (billingMode === "PER_COVER") {
      if (
        !input.coverCount ||
        !Number.isInteger(input.coverCount) ||
        input.coverCount < 1
      ) {
        throw new ValidationError(
          "PER_COVER orders require a positive coverCount",
        );
      }
      if (!input.perCoverPriceRuleId) {
        throw new ValidationError(
          "PER_COVER orders require perCoverPriceRuleId",
        );
      }
    } else if (
      input.coverCount !== undefined ||
      input.perCoverPriceRuleId !== undefined
    ) {
      throw new ValidationError(
        "Cover pricing fields are only valid for PER_COVER orders",
      );
    }

    const regularItems = input.items ?? [];
    await assertCourseSequencingAllowed(
      auth.tenantId,
      regularItems,
      input.combos ?? [],
    );
    assertInitialCourseSequence(regularItems, input.combos ?? []);
    if (regularItems.length === 0 && !input.combos?.length)
      throw new ValidationError("Order requires at least one item or combo");
    const asOf = new Date();
    const menuItemIds = regularItems.map((i) => i.menuItemId);
    const menuItemsData = await availabilityRepository.findByIds(
      auth.tenantId,
      menuItemIds,
      branchId,
      asOf,
    );
    const itemMap = new Map<string, PricableMenuItem>(
      menuItemsData.map(
        (m) => [m.id, m as unknown as PricableMenuItem] as const,
      ),
    );

    await assertItemsInSchedule(
      auth.tenantId,
      branchId,
      itemMap,
      menuItemIds,
      input.type,
      asOf,
    );

    const pricingContext = {
      tenantId: auth.tenantId,
      branchId,
      channel: "STAFF" as const,
      fulfillmentType: input.type,
      ...(input.customerId ? { customerId: input.customerId } : {}),
      ...(input.customerGroupId
        ? { customerGroupId: input.customerGroupId }
        : {}),
      asOf,
    };
    const regular = await pricingPipeline.price(pricingContext, regularItems);
    const combo = await priceComboOrders(pricingContext, input.combos ?? []);
    const resolved = [...regular.lines, ...combo.lines];
    // Combo components are normal menu items, so availability is checked on
    // the expanded component set before persistence/kitchen/inventory work.
    if (combo.lines.length) {
      const comboIds = combo.lines.flatMap((line) =>
        line.menuItemId === null ? [] : [line.menuItemId],
      );
      const comboItems = await availabilityRepository.findByIds(
        auth.tenantId,
        comboIds,
        branchId,
        asOf,
      );
      await assertItemsInSchedule(
        auth.tenantId,
        branchId,
        new Map(
          comboItems.map((m) => [m.id, m as unknown as PricableMenuItem]),
        ),
        comboIds,
        input.type,
        asOf,
      );
    }
    const promotionOptions = {
      ...(input.couponCode ? { couponCode: input.couponCode } : {}),
      ...(input.promotionIds?.length
        ? { promotionIds: input.promotionIds }
        : {}),
      ...(input.customerId ? { customerId: input.customerId } : {}),
    };
    let billablePricing;
    let linesToPersist = resolved;
    let perCoverRate: number | null = null;
    if (billingMode === "PER_COVER") {
      const cover = await pricingPipeline.resolvePerCoverRate(
        pricingContext,
        input.perCoverPriceRuleId!,
      );
      perCoverRate = cover.rate;
      const coverLine: PricedLine = {
        menuItemId: null,
        menuItemName: "Cover charge",
        quantity: input.coverCount!,
        unitPrice: cover.rate,
        subtotal: cover.rate * input.coverCount!,
        taxRate: cover.taxRate,
        fulfillmentType: input.type === "DINE_IN" ? "DINE_IN" : "TAKEAWAY",
        modifiers: [],
        pricingAttribution: { BASE_PRICE: cover.rate, VARIANT: 0, MODIFIER: 0 },
      };
      // G9 keeps kitchen/inventory lines intact while making them server-side
      // non-billable. The synthetic cover line exists only inside the one
      // pricing/finalization pipeline and is snapshotted on the order itself.
      billablePricing = await pricingPipeline.finalize(
        pricingContext,
        [coverLine],
        promotionOptions,
      );
      linesToPersist = resolved.map((line) => ({
        ...line,
        billingExcluded: true,
      }));
    } else {
      billablePricing = await pricingPipeline.finalize(
        pricingContext,
        resolved,
        promotionOptions,
      );
      linesToPersist = billablePricing.lines;
    }
    const snapshottedLines = await snapshotOrderLines(
      auth.tenantId,
      linesToPersist,
      pricingContext,
    );

    let order;
    try {
      order = await orderRepository.create({
        tenantId: auth.tenantId,
        branchId,
        tableId: input.tableId,
        createdBy: auth.userId,
        customerId: input.customerId ?? null,
        customerGroupId: input.customerGroupId ?? null,
        type: input.type,
        billingMode,
        coverCount: billingMode === "PER_COVER" ? input.coverCount! : null,
        perCoverPriceRuleId:
          billingMode === "PER_COVER" ? input.perCoverPriceRuleId! : null,
        perCoverRate,
        notes: input.notes,
        items: snapshottedLines,
        subtotal: billablePricing.subtotal,
        taxAmount: billablePricing.taxAmount,
        discountAmount: billablePricing.discountAmount,
        serviceChargeAmount: billablePricing.serviceChargeAmount,
        roundingAdjustment: billablePricing.roundingAdjustment,
        totalAmount: billablePricing.totalAmount,
        promotionRedemptions: billablePricing.redemptions,
        resolutionAsOf: asOf,
      });
    } catch (error) {
      metrics.increment("servora_order_processing_errors_total", { stage: "persist" });
      if (error instanceof DomainRuleError && error.details?.reason === "MANUAL_STOCK_DEPLETED") {
        throw new ValidationError(
          "One or more count-tracked items sold out while this order was being confirmed",
        );
      }
      throw error;
    }

    const fullOrder = await orderRepository.findById(auth.tenantId, order.id);

    if (input.type === "DINE_IN" && input.tableId) {
      const updatedTable = await tableRepository.update(
        auth.tenantId,
        input.tableId,
        {
          status: "OCCUPIED",
        },
      );
      if (updatedTable) {
        await eventBus.publish(
          {
            type: "table.updated",
            payload: updatedTable as unknown as RestaurantTable,
          },
          auth.tenantId,
          branchId,
        );
      }
    }

    await eventBus.publish(
      { type: "order.created", payload: fullOrder as unknown as Order },
      auth.tenantId,
      branchId,
    );

    // Publish every initial course ticket. HELD courses are visible to KDS but
    // deliberately do not consume inventory until they transition to FIRED.
    for (const createdTicket of fullOrder?.kitchenTickets ?? []) {
      await eventBus.publish(
        {
          type: "kitchen.ticket.created",
          payload: createdTicket as unknown as KitchenTicket,
        },
        auth.tenantId,
        branchId,
      );
      if (createdTicket.status !== "FIRED") continue;
      try {
        await inventoryService.deductForOrderItems(
          auth.tenantId,
          branchId,
          order.id,
          createdTicket.id,
          createdTicket.items.flatMap((item) =>
            item.menuItemId === null
              ? []
              : [
                  {
                    orderItemId: item.id,
                    menuItemId: item.menuItemId,
                    variantId: item.variantId,
                    quantity: item.quantity,
                    weightQuantity: item.weightQuantity,
                    weightUnit: item.weightUnit,
                    selectedOptions: item.modifiers.flatMap((modifier) =>
                      modifier.modifierId == null ? [] : [{ optionId: modifier.modifierId, quantity: modifier.quantity }],
                    ),
                  },
                ],
          ),
          auth.userId,
        );
      } catch (err) {
        metrics.increment("servora_order_processing_errors_total", { stage: "inventory_deduction" });
        console.error("Inventory deduction failed for order", order.id, err);
      }
    }

    return fullOrder;
  },

};
