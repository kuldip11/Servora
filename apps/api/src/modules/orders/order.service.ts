/**
 * Order service — orchestrates repository + branch/table validation +
 * pricing (PricingPipeline) + status transitions (order-status.machine.ts)
 * + inventory deduction + event publishing. This is the module's biggest
 * service by a wide margin because order creation genuinely touches the
 * most other subsystems (menu, tables, branches, kitchen tickets,
 * inventory) — that breadth is inherent to the domain, not something a
 * file split alone fixes.
 */
import type {
  KitchenTicket,
  Order,
  OrderStatus,
  OrderType,
  RestaurantTable,
} from "@pos/types";
import type { AuthContext } from "../../core/auth";
import {
  requireOrdersPermission,
  assertOrderListScope,
  assertOrderResourceAccess,
} from "./orders-authorization";
import { DomainRuleError, ValidationError } from "../../core/errors";
import { writeAudit } from "../../core/audit";
import { availabilityRepository } from "../menu/availability/availability.repository";
import { availabilityService } from "../menu/availability/availability.service";
import { tableRepository } from "../tables/table.repository";
import { ticketRepository } from "../kitchen-tickets/ticket.repository";
import { branchRepository } from "../branches/branch.repository";
import { tenantRepository } from "../tenants/tenant.repository";
import { inventoryService } from "../inventory/inventory.service";
import { eventBus } from "../../lib/event-bus";
import { orderRepository } from "./order.repository";
import {
  pricingPipeline,
  type OrderItemInput,
  type PricableMenuItem,
  type PricedLine,
} from "./pricing/pricing-pipeline";
import { assertValidOrderTransition } from "./order-status.machine";
import { menuResolver } from "../menu/menus/menu-resolver.service";
import { snapshotOrderLines } from "./order-line-snapshot.service";
import {
  priceComboOrders,
  type ComboOrderSelection,
} from "../menu/combos/combo-order.service";
import { promotionRepository } from "../menu/promotions/promotion.repository";
import { cancellationReasonService } from "./cancellation-reasons/cancellation-reason.service";
import { customerGroupRepository } from "../customer-groups/customer-group.repository";
import {
  finalizeWholeActiveOrder,
  storedOrderLineToStage4Snapshot,
  type StoredOrderLineForRepricing,
} from "./active-order-pricing";
import { isBillableOrderItem } from "./order-item-billing";
import { approvalService } from "../approvals/approval.service";
import { approvalAdjustmentValue } from "../approvals/approval-policy";
import {
  orderNotFound,
  branchRequiredForOrder,
  orderBranchNotFound,
  orderTypeDisabled,
  tableRequiredForDineIn,
  orderTableNotFound,
  tableOccupied,
  ticketsNotServed,
  orderNotOpen,
  orderItemNotFound,
  orderItemCannotBeVoided,
  orderItemCannotBeComped,
  orderItemCannotBeRefired,
  orderCannotTransferTable,
  orderCannotMerge,
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

function requestedCourseNumbers(
  items: OrderItemInput[],
  combos: ComboOrderSelection[],
) {
  return [
    ...items.map((item) => item.courseNumber),
    ...combos.map((combo) => combo.courseNumber),
  ].filter((value): value is number => value !== undefined);
}

async function assertCourseSequencingAllowed(
  tenantId: string,
  items: OrderItemInput[],
  combos: ComboOrderSelection[],
) {
  if (!requestedCourseNumbers(items, combos).length) return;
  const tenant = await tenantRepository.findById(tenantId);
  if (!tenant?.courseSequencingEnabled) {
    throw new ValidationError(
      "Course sequencing is not enabled for this tenant",
    );
  }
}

function assertInitialCourseSequence(
  items: OrderItemInput[],
  combos: ComboOrderSelection[],
) {
  const numbers = requestedCourseNumbers(items, combos);
  if (!numbers.length) return;
  const requestedLineCount = items.length + combos.length;
  if (numbers.length !== requestedLineCount) {
    throw new ValidationError(
      "Every line must have a course when course sequencing is used",
    );
  }
  const unique = [...new Set(numbers)].sort((a, b) => a - b);
  if (unique[0] !== 1 || unique.some((value, index) => value !== index + 1)) {
    throw new ValidationError("Courses must start at 1 and be contiguous");
  }
}

function singleCourseNumber(
  items: OrderItemInput[],
  combos: ComboOrderSelection[],
) {
  const numbers = requestedCourseNumbers(items, combos);
  const unique = [...new Set(numbers)];
  if (unique.length > 1)
    throw new ValidationError(
      "A single fire action can contain only one course",
    );
  return unique[0];
}

// A menu item can be temporarily hidden/out-of-stock via a schedule (e.g.
// "Breakfast items 7-11 AM only") without touching its stored base status,
// or via a branch override (e.g. this branch is out of it, or prices it
// differently) — both are checked in addition to menuItem.isAvailable,
// since either can turn an otherwise-ACTIVE item off for this branch/time.
// getEffectiveItem already applies the full precedence: manual override >
// branch override > schedule status > base status.
async function assertItemsInSchedule(
  tenantId: string,
  branchId: string,
  itemMap: Map<string, PricableMenuItem>,
  requestedItemIds: string[],
  orderType: OrderType,
  asOf: Date,
): Promise<void> {
  const uniqueIds = Array.from(new Set(requestedItemIds));
  const activeMenuItemIds = await menuResolver.getActiveItemIds(
    tenantId,
    branchId,
    "STAFF",
    orderType,
    asOf,
  );
  for (const id of uniqueIds) {
    const menuItem = itemMap.get(id);
    if (!menuItem) continue; // PricingPipeline will raise the not-found error
    if (!activeMenuItemIds.has(id)) {
      throw new ValidationError(
        `${menuItem.name} isn't on an active menu for this order`,
      );
    }
    const effective = await availabilityService.getEffectiveItem(
      tenantId,
      id,
      branchId,
      { channel: "STAFF", fulfillmentType: orderType, asOf },
    );
    if (effective.isHidden) {
      throw new ValidationError(
        `${menuItem.name} isn't available at this branch`,
      );
    }
    if (effective.effectiveStatus !== "ACTIVE") {
      const reason = effective.availabilityReason ?? "currently unavailable";
      throw new ValidationError(
        `${menuItem.name} isn't available right now (${reason})`,
      );
    }
  }
}

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

export interface FireTicketInput {
  notes?: string | undefined;
  couponCode?: string | undefined;
  promotionIds?: string[] | undefined;
  items?: OrderItemInput[] | undefined;
  combos?: ComboOrderSelection[] | undefined;
}

export const orderService = {
  async list(
    auth: AuthContext,
    filters?: { status?: string | undefined; type?: string | undefined },
  ) {
    requireOrdersPermission(auth, "orders:read");
    assertOrderListScope(auth);
    return orderRepository.findMany(auth.tenantId, auth.branchId, filters);
  },

  async getById(auth: AuthContext, orderId: string) {
    requireOrdersPermission(auth, "orders:read");
    const order = await orderRepository.findById(auth.tenantId, orderId);
    if (!order) throw orderNotFound(orderId);
    assertOrderResourceAccess(auth, order.branchId);
    return order;
  },

  async getInventoryImpact(auth: AuthContext, orderId: string) {
    requireOrdersPermission(auth, "orders:read");
    const order = await orderRepository.findById(auth.tenantId, orderId);
    if (!order) throw orderNotFound(orderId);
    assertOrderResourceAccess(auth, order.branchId);
    return inventoryService.getOrderDeductions(orderId);
  },

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
        console.error("Inventory deduction failed for order", order.id, err);
      }
    }

    return fullOrder;
  },

  async updateStatus(
    auth: AuthContext,
    orderId: string,
    newStatus: OrderStatus,
    reason?: string | undefined,
    cancellationReasonId?: string | undefined,
    approvalToken?: string | undefined,
  ) {
    requireOrdersPermission(
      auth,
      newStatus === "CANCELLED" ? "orders:cancel" : "orders:update_status",
    );
    const order = await orderRepository.findById(auth.tenantId, orderId);
    if (!order) throw orderNotFound(orderId);
    assertOrderResourceAccess(auth, order.branchId);

    assertValidOrderTransition(order.status, newStatus);
    if (newStatus === "CANCELLED") {
      if (!reason?.trim() && !cancellationReasonId) {
        throw new ValidationError("A cancellation reason is required");
      }
      await cancellationReasonService.assertUsable(
        auth.tenantId,
        cancellationReasonId,
      );
    }

    // Don't let the tab move to billing while the kitchen still owes items.
    if (newStatus === "BILL_REQUESTED") {
      const allServed = await ticketRepository.allServed(
        auth.tenantId,
        orderId,
      );
      if (!allServed) throw ticketsNotServed();
    }

    const updated = await orderRepository.updateStatus(
      auth.tenantId,
      orderId,
      newStatus,
      auth.userId,
      reason,
      cancellationReasonId,
      order.branchId,
    );
    if (!updated) throw orderNotFound(orderId);

    const fullOrder = await orderRepository.findById(auth.tenantId, orderId);

    // Free up the table once the tab is paid (diners have settled up) or
    // cancelled. (CLOSED is included too since it's harmless to re-affirm
    // AVAILABLE at that point.)
    if (
      order.tableId &&
      (["PAID", "CLOSED", "CANCELLED"] as OrderStatus[]).includes(newStatus)
    ) {
      const updatedTable = await tableRepository.update(
        auth.tenantId,
        order.tableId,
        {
          status: "AVAILABLE",
        },
      );
      if (updatedTable) {
        await eventBus.publish(
          {
            type: "table.updated",
            payload: updatedTable as unknown as RestaurantTable,
          },
          auth.tenantId,
          order.branchId,
        );
      }
    }

    await eventBus.publish(
      { type: "order.updated", payload: fullOrder as unknown as Order },
      auth.tenantId,
      order.branchId,
    );

    return fullOrder;
  },

  async voidItem(
    auth: AuthContext,
    orderId: string,
    orderItemId: string,
    reason?: string | undefined,
    cancellationReasonId?: string | undefined,
    approvalToken?: string | undefined,
  ) {
    requireOrdersPermission(auth, "orders:void");
    if (!reason?.trim() && !cancellationReasonId) {
      throw new ValidationError("A void reason is required");
    }
    await cancellationReasonService.assertUsable(
      auth.tenantId,
      cancellationReasonId,
    );
    const order = await orderRepository.findById(auth.tenantId, orderId);
    if (!order) throw orderNotFound(orderId);
    assertOrderResourceAccess(auth, order.branchId);
    if (order.status !== "OPEN") {
      throw orderItemCannotBeVoided(
        "Items can only be voided on an open order",
      );
    }
    const item = order.items.find((candidate) => candidate.id === orderItemId);
    if (!item) throw orderItemNotFound(orderItemId);
    if (item.itemStatus !== "ACTIVE") {
      throw orderItemCannotBeVoided(
        "This item has already been voided or comped",
      );
    }
    const adjustmentValue = approvalAdjustmentValue(order.items, orderItemId);
    await approvalService.assertApproved(
      auth.tenantId,
      "VOID",
      orderId,
      orderItemId,
      adjustmentValue,
      approvalToken,
    );
    const ticket = order.kitchenTickets?.find((candidate) =>
      candidate.items?.some((ticketItem) => ticketItem.id === orderItemId),
    );
    if (ticket?.status === "SERVED") {
      throw orderItemCannotBeVoided("A served item cannot be voided");
    }

    const remaining = order.items.filter((candidate) => {
      const sameAdjustmentTarget = item.comboGroupId
        ? candidate.comboGroupId === item.comboGroupId
        : candidate.id === orderItemId;
      return !sameAdjustmentTarget && isBillableOrderItem(candidate);
    });
    const existingRedemptions =
      await promotionRepository.listRedemptionsForOrder(orderId);
    const pricingContext = {
      tenantId: auth.tenantId,
      branchId: order.branchId,
      channel: "STAFF" as const,
      fulfillmentType: order.type,
      asOf: new Date(),
      ...(order.customerId ? { customerId: order.customerId } : {}),
      ...(order.customerGroupId
        ? { customerGroupId: order.customerGroupId }
        : {}),
    };
    const repriced =
      order.billingMode === "PER_COVER"
        ? {
            subtotal: Number(order.subtotal),
            discountAmount: Number(order.discountAmount),
            taxAmount: Number(order.taxAmount),
            serviceChargeAmount: Number(order.serviceChargeAmount),
            roundingAdjustment: Number(order.roundingAdjustment),
            totalAmount: Number(order.totalAmount),
            existingPricingUpdates: [] as Array<{
              id: string;
              pricingAttribution: PricedLine["pricingAttribution"];
              taxMode: "INCLUSIVE" | "EXCLUSIVE";
            }>,
            redemptions: existingRedemptions,
          }
        : await finalizeWholeActiveOrder(
            pricingContext,
            remaining as StoredOrderLineForRepricing[],
            [],
            {
              ...(existingRedemptions.length
                ? {
                    promotionIds: existingRedemptions.map(
                      (entry) => entry.promotionId,
                    ),
                  }
                : {}),
              ...(order.customerId ? { customerId: order.customerId } : {}),
            },
          );
    const totals = {
      subtotal: repriced.subtotal,
      discountAmount: repriced.discountAmount,
      taxAmount: repriced.taxAmount,
      serviceChargeAmount: repriced.serviceChargeAmount,
      roundingAdjustment: repriced.roundingAdjustment,
      totalAmount: repriced.totalAmount,
      existingPricingUpdates: repriced.existingPricingUpdates,
      promotionRedemptions: repriced.redemptions,
    };
    const updated = await orderRepository.voidItem(
      auth.tenantId,
      orderId,
      orderItemId,
      auth.userId,
      reason?.trim() ?? "",
      cancellationReasonId,
      totals,
    );
    if (!updated) {
      throw orderItemCannotBeVoided(
        "This item has already been voided or comped",
      );
    }
    if (updated.reversedInventoryItemIds.length) {
      await inventoryService.syncMenuItemAvailability(
        auth.tenantId,
        order.branchId,
        updated.reversedInventoryItemIds,
      );
    }

    const fullOrder = await orderRepository.findById(auth.tenantId, orderId);
    await eventBus.publish(
      { type: "order.updated", payload: fullOrder as unknown as Order },
      auth.tenantId,
      order.branchId,
    );
    const updatedTicket = fullOrder?.kitchenTickets?.find(
      (candidate) => candidate.id === ticket?.id,
    );
    if (updatedTicket) {
      await eventBus.publish(
        {
          type: "order.item.voided",
          payload: updatedTicket as unknown as KitchenTicket,
        },
        auth.tenantId,
        order.branchId,
      );
    }
    return fullOrder;
  },

  async compItem(
    auth: AuthContext,
    orderId: string,
    orderItemId: string,
    reason?: string | undefined,
    cancellationReasonId?: string | undefined,
    approvalToken?: string | undefined,
  ) {
    requireOrdersPermission(auth, "orders:comp");
    if (!reason?.trim() && !cancellationReasonId) {
      throw new ValidationError("A comp reason is required");
    }
    await cancellationReasonService.assertUsable(
      auth.tenantId,
      cancellationReasonId,
    );
    const order = await orderRepository.findById(auth.tenantId, orderId);
    if (!order) throw orderNotFound(orderId);
    assertOrderResourceAccess(auth, order.branchId);
    if (order.status !== "OPEN") {
      throw orderItemCannotBeComped(
        "Items can only be comped on an open order",
      );
    }
    const item = order.items.find((candidate) => candidate.id === orderItemId);
    if (!item) throw orderItemNotFound(orderItemId);
    if (item.itemStatus !== "ACTIVE") {
      throw orderItemCannotBeComped(
        "This item has already been voided or comped",
      );
    }
    const adjustmentValue = approvalAdjustmentValue(order.items, orderItemId);
    await approvalService.assertApproved(
      auth.tenantId,
      "COMP",
      orderId,
      orderItemId,
      adjustmentValue,
      approvalToken,
    );

    const remaining = order.items.filter((candidate) => {
      const sameAdjustmentTarget = item.comboGroupId
        ? candidate.comboGroupId === item.comboGroupId
        : candidate.id === orderItemId;
      return !sameAdjustmentTarget && isBillableOrderItem(candidate);
    });
    const existingRedemptions =
      await promotionRepository.listRedemptionsForOrder(orderId);
    const pricingContext = {
      tenantId: auth.tenantId,
      branchId: order.branchId,
      channel: "STAFF" as const,
      fulfillmentType: order.type,
      asOf: new Date(),
      ...(order.customerId ? { customerId: order.customerId } : {}),
      ...(order.customerGroupId
        ? { customerGroupId: order.customerGroupId }
        : {}),
    };
    const repriced =
      order.billingMode === "PER_COVER"
        ? {
            subtotal: Number(order.subtotal),
            discountAmount: Number(order.discountAmount),
            taxAmount: Number(order.taxAmount),
            serviceChargeAmount: Number(order.serviceChargeAmount),
            roundingAdjustment: Number(order.roundingAdjustment),
            totalAmount: Number(order.totalAmount),
            existingPricingUpdates: [] as Array<{
              id: string;
              pricingAttribution: PricedLine["pricingAttribution"];
              taxMode: "INCLUSIVE" | "EXCLUSIVE";
            }>,
            redemptions: existingRedemptions,
          }
        : await finalizeWholeActiveOrder(
            pricingContext,
            remaining as StoredOrderLineForRepricing[],
            [],
            {
              ...(existingRedemptions.length
                ? {
                    promotionIds: existingRedemptions.map(
                      (entry) => entry.promotionId,
                    ),
                  }
                : {}),
              ...(order.customerId ? { customerId: order.customerId } : {}),
            },
          );
    const totals = {
      subtotal: repriced.subtotal,
      discountAmount: repriced.discountAmount,
      taxAmount: repriced.taxAmount,
      serviceChargeAmount: repriced.serviceChargeAmount,
      roundingAdjustment: repriced.roundingAdjustment,
      totalAmount: repriced.totalAmount,
      existingPricingUpdates: repriced.existingPricingUpdates,
      promotionRedemptions: repriced.redemptions,
    };
    const updated = await orderRepository.compItem(
      auth.tenantId,
      orderId,
      orderItemId,
      auth.userId,
      reason?.trim() ?? "",
      cancellationReasonId,
      totals,
    );
    if (!updated) {
      throw orderItemCannotBeComped(
        "This item has already been voided or comped",
      );
    }

    const fullOrder = await orderRepository.findById(auth.tenantId, orderId);
    await eventBus.publish(
      { type: "order.updated", payload: fullOrder as unknown as Order },
      auth.tenantId,
      order.branchId,
    );
    return fullOrder;
  },

  // Fires a new round ("Send to Kitchen") on an existing tab — creates a
  // brand new kitchen ticket rather than mutating a previous one.
  async fireTicket(auth: AuthContext, orderId: string, input: FireTicketInput) {
    requireOrdersPermission(auth, "orders:update");
    const order = await orderRepository.findById(auth.tenantId, orderId);
    if (!order) throw orderNotFound(orderId);
    assertOrderResourceAccess(auth, order.branchId);

    // A tab stays open for the whole sitting — new rounds can be fired any
    // time before the bill's been requested.
    if (order.status !== "OPEN") {
      throw orderNotOpen(order.status);
    }

    const regularItems = input.items ?? [];
    await assertCourseSequencingAllowed(
      auth.tenantId,
      regularItems,
      input.combos ?? [],
    );
    const fireCourseNumbers = requestedCourseNumbers(
      regularItems,
      input.combos ?? [],
    );
    if (
      fireCourseNumbers.length > 0 &&
      fireCourseNumbers.length !==
        regularItems.length + (input.combos?.length ?? 0)
    ) {
      throw new ValidationError(
        "Every line must have a course when course sequencing is used",
      );
    }
    if (regularItems.length === 0 && !input.combos?.length) {
      throw new ValidationError("Order requires at least one item or combo");
    }
    const asOf = new Date();
    const menuItemIds = regularItems.map((item) => item.menuItemId);
    const menuItemsData = await availabilityRepository.findByIds(
      auth.tenantId,
      menuItemIds,
      order.branchId,
      asOf,
    );
    const itemMap = new Map<string, PricableMenuItem>(
      menuItemsData.map(
        (item) => [item.id, item as unknown as PricableMenuItem] as const,
      ),
    );

    await assertItemsInSchedule(
      auth.tenantId,
      order.branchId,
      itemMap,
      menuItemIds,
      order.type,
      asOf,
    );

    const pricingContext = {
      tenantId: auth.tenantId,
      branchId: order.branchId,
      channel: "STAFF" as const,
      fulfillmentType: order.type,
      asOf,
      ...(order.customerId ? { customerId: order.customerId } : {}),
      ...(order.customerGroupId
        ? { customerGroupId: order.customerGroupId }
        : {}),
    };
    const regular = await pricingPipeline.price(pricingContext, regularItems);
    const combo = await priceComboOrders(pricingContext, input.combos ?? []);
    const newStage4Lines = [...regular.lines, ...combo.lines];

    if (combo.lines.length) {
      const comboIds = combo.lines.flatMap((line) =>
        line.menuItemId === null ? [] : [line.menuItemId],
      );
      const comboItems = await availabilityRepository.findByIds(
        auth.tenantId,
        comboIds,
        order.branchId,
        asOf,
      );
      await assertItemsInSchedule(
        auth.tenantId,
        order.branchId,
        new Map(
          comboItems.map(
            (item) => [item.id, item as unknown as PricableMenuItem] as const,
          ),
        ),
        comboIds,
        order.type,
        asOf,
      );
    }

    if (
      order.billingMode === "PER_COVER" &&
      (input.couponCode?.trim() || input.promotionIds?.length)
    ) {
      throw new ValidationError(
        "Per-cover pricing is snapshotted when the order is created; item-round promotion changes are not allowed",
      );
    }
    const priorRedemptions =
      await promotionRepository.listRedemptionsForOrder(orderId);
    const continuedPromotionIds = [
      ...new Set([
        ...priorRedemptions.map((entry) => entry.promotionId),
        ...(input.promotionIds ?? []),
      ]),
    ];
    const activeExistingItems = order.items.filter((item) =>
      isBillableOrderItem(item),
    );
    const repriced =
      order.billingMode === "PER_COVER"
        ? {
            existingPricingUpdates: [] as Array<{
              id: string;
              pricingAttribution: PricedLine["pricingAttribution"];
              taxMode: "INCLUSIVE" | "EXCLUSIVE";
            }>,
            // Kitchen/inventory lines on buffet orders never become billable,
            // including lines added after the initial order.
            newLines: newStage4Lines.map((line) => ({
              ...line,
              billingExcluded: true,
            })),
            subtotal: Number(order.subtotal),
            taxAmount: Number(order.taxAmount),
            discountAmount: Number(order.discountAmount),
            serviceChargeAmount: Number(order.serviceChargeAmount),
            roundingAdjustment: Number(order.roundingAdjustment),
            totalAmount: Number(order.totalAmount),
            redemptions: priorRedemptions,
          }
        : await finalizeWholeActiveOrder(
            pricingContext,
            activeExistingItems as StoredOrderLineForRepricing[],
            newStage4Lines,
            {
              ...(input.couponCode ? { couponCode: input.couponCode } : {}),
              ...(continuedPromotionIds.length
                ? { promotionIds: continuedPromotionIds }
                : {}),
              ...(order.customerId ? { customerId: order.customerId } : {}),
            },
          );
    const snapshottedNewLines = await snapshotOrderLines(
      auth.tenantId,
      repriced.newLines,
      pricingContext,
    );
    const courseNumber = singleCourseNumber(regularItems, input.combos ?? []);
    if (courseNumber !== undefined && courseNumber > 1) {
      const hasPriorCourse = await ticketRepository.hasCourseNumber(
        auth.tenantId,
        orderId,
        courseNumber - 1,
      );
      if (!hasPriorCourse) {
        throw new ValidationError(
          `Course ${courseNumber - 1} must exist before Course ${courseNumber} can be added`,
        );
      }
    }
    const courseStatus =
      courseNumber !== undefined &&
      (await ticketRepository.shouldHoldCourse(
        auth.tenantId,
        orderId,
        courseNumber,
      ))
        ? ("HELD" as const)
        : ("FIRED" as const);

    let ticket;
    try {
      ticket = await orderRepository.fireNewTicket(
        auth.tenantId,
        order.branchId,
        orderId,
        snapshottedNewLines,
        newStage4Lines.reduce((sum, line) => sum + line.subtotal, 0),
        0,
        input.notes,
        null,
        {
          existingPricingUpdates: repriced.existingPricingUpdates,
          absoluteTotals: {
            subtotal: repriced.subtotal,
            taxAmount: repriced.taxAmount,
            discountAmount: repriced.discountAmount,
            serviceChargeAmount: repriced.serviceChargeAmount,
            roundingAdjustment: repriced.roundingAdjustment,
            totalAmount: repriced.totalAmount,
          },
          promotionRedemptions: repriced.redemptions,
          replacePromotionRedemptions: true,
        },
        courseNumber === undefined
          ? undefined
          : { number: courseNumber, status: courseStatus },
      );
    } catch (error) {
      if (error instanceof DomainRuleError && error.details?.reason === "MANUAL_STOCK_DEPLETED") {
        throw new ValidationError(
          "One or more count-tracked items sold out while this round was being confirmed",
        );
      }
      throw error;
    }
    const fullOrder = await orderRepository.findById(auth.tenantId, orderId);

    await eventBus.publish(
      { type: "order.updated", payload: fullOrder as unknown as Order },
      auth.tenantId,
      order.branchId,
    );
    const createdTicket = fullOrder?.kitchenTickets?.find(
      (candidate) => candidate.id === ticket.id,
    );
    if (createdTicket) {
      await eventBus.publish(
        {
          type: "kitchen.ticket.created",
          payload: createdTicket as unknown as KitchenTicket,
        },
        auth.tenantId,
        order.branchId,
      );
    }

    try {
      if (createdTicket?.status === "FIRED")
        await inventoryService.deductForOrderItems(
          auth.tenantId,
          order.branchId,
          orderId,
          ticket.id,
          (createdTicket?.items ?? []).flatMap((item) =>
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
      console.error("Inventory deduction failed for order", orderId, err);
    }

    return fullOrder;
  },

  async refireItem(
    auth: AuthContext,
    orderId: string,
    orderItemId: string,
    reason: string,
    alsoCompOriginal = true,
  ) {
    requireOrdersPermission(auth, "orders:update");
      if (alsoCompOriginal) requireOrdersPermission(auth, "orders:comp");
    if (!reason.trim())
      throw new ValidationError("A refire reason is required");
    const order = await orderRepository.findById(auth.tenantId, orderId);
    if (!order) throw orderNotFound(orderId);
    assertOrderResourceAccess(auth, order.branchId);
    if (order.status !== "OPEN")
      throw orderItemCannotBeRefired(
        "Items can only be refired on an open order",
      );
    const original = order.items.find((item) => item.id === orderItemId);
    if (!original || original.menuItemId === null)
      throw orderItemNotFound(orderItemId);
    if (original.itemStatus !== "ACTIVE")
      throw orderItemCannotBeRefired("Only an active item can be refired");
    const originalTicket = order.kitchenTickets?.find((ticket) =>
      ticket.items?.some((item) => item.id === orderItemId),
    );
    if (
      !originalTicket ||
      ["HELD", "PENDING_PAYMENT"].includes(originalTicket.status)
    ) {
      throw orderItemCannotBeRefired(
        "An item can only be refired after it has actually been sent to the kitchen",
      );
    }

    const asOf = new Date();
    const pricingContext = {
      tenantId: auth.tenantId,
      branchId: order.branchId,
      channel: "STAFF" as const,
      fulfillmentType: order.type,
      asOf,
      ...(order.customerId ? { customerId: order.customerId } : {}),
      ...(order.customerGroupId
        ? { customerGroupId: order.customerGroupId }
        : {}),
    };
    // Re-fire is a new preparation instance of the historical line, not a
    // brand-new menu selection. Preserve the original authoritative stage-4
    // snapshot (especially combo allocation/group identity) and refresh only
    // fire-time routing/version snapshots. This prevents a combo component
    // from being repriced as a standalone dish while still honoring current
    // station routing for the new kitchen instance.
    const storedSource = storedOrderLineToStage4Snapshot(
      original as StoredOrderLineForRepricing,
    );
    const [sourceLine] = await snapshotOrderLines(
      auth.tenantId,
      [storedSource],
      pricingContext,
    );
    if (!sourceLine)
      throw orderItemCannotBeRefired(
        "The item can no longer be snapshotted for refire",
      );
    const existingRedemptions =
      await promotionRepository.listRedemptionsForOrder(orderId);
    const existing = order.items.filter(
      (item) =>
        isBillableOrderItem(item) &&
        (!alsoCompOriginal || item.id !== orderItemId),
    );
    const repriced =
      order.billingMode === "PER_COVER"
        ? {
            subtotal: Number(order.subtotal),
            taxAmount: Number(order.taxAmount),
            discountAmount: Number(order.discountAmount),
            serviceChargeAmount: Number(order.serviceChargeAmount),
            roundingAdjustment: Number(order.roundingAdjustment),
            totalAmount: Number(order.totalAmount),
            existingPricingUpdates: [],
            redemptions: existingRedemptions,
            newLines: [{ ...sourceLine, billingExcluded: true }],
          }
        : await finalizeWholeActiveOrder(
            pricingContext,
            existing as StoredOrderLineForRepricing[],
            [sourceLine],
            {
              ...(existingRedemptions.length
                ? {
                    promotionIds: existingRedemptions.map(
                      (entry) => entry.promotionId,
                    ),
                  }
                : {}),
              ...(order.customerId ? { customerId: order.customerId } : {}),
            },
          );
    const [replacementLine] = await snapshotOrderLines(
      auth.tenantId,
      repriced.newLines,
      pricingContext,
    );
    if (!replacementLine)
      throw orderItemCannotBeRefired(
        "The replacement item could not be snapshotted",
      );

    const result = await orderRepository.refireItem({
      tenantId: auth.tenantId,
      branchId: order.branchId,
      orderId,
      originalItemId: orderItemId,
      item: replacementLine,
      changedBy: auth.userId,
      reason: reason.trim(),
      compOriginal: alsoCompOriginal,
      refireType: "REFIRE",
      absoluteTotals: {
        subtotal: repriced.subtotal,
        taxAmount: repriced.taxAmount,
        discountAmount: repriced.discountAmount,
        serviceChargeAmount: repriced.serviceChargeAmount,
        roundingAdjustment: repriced.roundingAdjustment,
        totalAmount: repriced.totalAmount,
      },
      existingPricingUpdates: repriced.existingPricingUpdates,
      promotionRedemptions: repriced.redemptions,
    });
    if (!result)
      throw orderItemCannotBeRefired("This item can no longer be refired");
    const [detailedTicket, refreshedOriginalTicket] = await Promise.all([
      ticketRepository.findDetailedById(auth.tenantId, result.ticket.id),
      ticketRepository.findDetailedById(auth.tenantId, originalTicket.id),
    ]);
    const fullOrder = await orderRepository.findById(auth.tenantId, orderId);
    if (fullOrder)
      await eventBus.publish(
        { type: "order.updated", payload: fullOrder as unknown as Order },
        auth.tenantId,
        order.branchId,
      );
    if (refreshedOriginalTicket) {
      await eventBus.publish(
        {
          type: "kitchen.ticket.updated",
          payload: refreshedOriginalTicket as unknown as KitchenTicket,
        },
        auth.tenantId,
        order.branchId,
      );
    }
    if (detailedTicket)
      await eventBus.publish(
        {
          type: "kitchen.ticket.created",
          payload: detailedTicket as unknown as KitchenTicket,
        },
        auth.tenantId,
        order.branchId,
      );
    await writeAudit({
      tenantId: auth.tenantId,
      userId: auth.userId,
      branchId: order.branchId,
      requestId: auth.requestId,
      ipAddress: auth.ipAddress,
      action: "ORDER_ITEM_REFIRED",
      entity: "order_item",
      entityId: result.replacement.id,
      metadata: {
        orderId,
        originalItemId: orderItemId,
        reason: reason.trim(),
        compedOriginal: alsoCompOriginal,
      },
    });
    if (detailedTicket) {
      try {
        await inventoryService.deductForOrderItems(
          auth.tenantId,
          order.branchId,
          orderId,
          detailedTicket.id,
          detailedTicket.items.flatMap((item) =>
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
        console.error(
          "Inventory deduction failed for refire",
          result.replacement.id,
          err,
        );
      }
    }
    return fullOrder;
  },

  async refillItem(auth: AuthContext, orderId: string, orderItemId: string) {
    requireOrdersPermission(auth, "orders:update");
      const order = await orderRepository.findById(auth.tenantId, orderId);
    if (!order) throw orderNotFound(orderId);
    assertOrderResourceAccess(auth, order.branchId);
    if (order.status !== "OPEN")
      throw orderItemCannotBeRefired(
        "Refills are only available on an open order",
      );
    const original = order.items.find((item) => item.id === orderItemId);
    if (!original || original.menuItemId === null)
      throw orderItemNotFound(orderItemId);
    if (
      original.itemStatus !== "ACTIVE" ||
      !original.comboSlotOption?.isUnlimitedRefill
    ) {
      throw orderItemCannotBeRefired(
        "This combo component is not eligible for unlimited refill",
      );
    }
    const originalTicket = order.kitchenTickets?.find((ticket) =>
      ticket.items?.some((item) => item.id === orderItemId),
    );
    if (
      !originalTicket ||
      ["HELD", "PENDING_PAYMENT"].includes(originalTicket.status)
    ) {
      throw orderItemCannotBeRefired(
        "A refill is available only after the original component was fired",
      );
    }
    const asOf = new Date();
    const source = storedOrderLineToStage4Snapshot(
      original as StoredOrderLineForRepricing,
    );
    const zeroLine: PricedLine = {
      ...source,
      unitPrice: 0,
      subtotal: 0,
      billingExcluded: true,
      comboSlotOptionId: original.comboSlotOptionId ?? undefined,
      modifiers: source.modifiers.map((modifier) => ({
        ...modifier,
        price: 0,
      })),
      pricingAttribution: {
        ...source.pricingAttribution,
        BASE_PRICE: 0,
        VARIANT: 0,
        MODIFIER: 0,
        COMBO: 0,
      },
    };
    const [replacementLine] = await snapshotOrderLines(
      auth.tenantId,
      [zeroLine],
      {
        branchId: order.branchId,
        channel: order.source,
        fulfillmentType: order.type,
        asOf,
      },
    );
    if (!replacementLine)
      throw orderItemCannotBeRefired("The refill could not be snapshotted");
    const result = await orderRepository.refireItem({
      tenantId: auth.tenantId,
      branchId: order.branchId,
      orderId,
      originalItemId: orderItemId,
      item: replacementLine,
      changedBy: auth.userId,
      reason: "Unlimited refill",
      compOriginal: false,
      claimOriginal: false,
      refireType: "REFILL",
      forceBillingExcluded: true,
      absoluteTotals: {
        subtotal: Number(order.subtotal),
        taxAmount: Number(order.taxAmount),
        discountAmount: Number(order.discountAmount),
        serviceChargeAmount: Number(order.serviceChargeAmount),
        roundingAdjustment: Number(order.roundingAdjustment),
        totalAmount: Number(order.totalAmount),
      },
    });
    if (!result)
      throw orderItemCannotBeRefired(
        "This component can no longer be refilled",
      );
    const detailedTicket = await ticketRepository.findDetailedById(
      auth.tenantId,
      result.ticket.id,
    );
    const fullOrder = await orderRepository.findById(auth.tenantId, orderId);
    if (fullOrder)
      await eventBus.publish(
        { type: "order.updated", payload: fullOrder as unknown as Order },
        auth.tenantId,
        order.branchId,
      );
    if (detailedTicket) {
      await eventBus.publish(
        {
          type: "kitchen.ticket.created",
          payload: detailedTicket as unknown as KitchenTicket,
        },
        auth.tenantId,
        order.branchId,
      );
      try {
        await inventoryService.deductForOrderItems(
          auth.tenantId,
          order.branchId,
          orderId,
          detailedTicket.id,
          detailedTicket.items.flatMap((item) =>
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
        console.error(
          "Inventory deduction failed for refill",
          result.replacement.id,
          err,
        );
      }
    }
    await writeAudit({
      tenantId: auth.tenantId,
      userId: auth.userId,
      branchId: order.branchId,
      requestId: auth.requestId,
      ipAddress: auth.ipAddress,
      action: "ORDER_ITEM_REFILL",
      entity: "order_item",
      entityId: result.replacement.id,
      metadata: {
        orderId,
        originalItemId: orderItemId,
        comboGroupId: original.comboGroupId,
      },
    });
    return fullOrder;
  },

  async transferTable(
    auth: AuthContext,
    orderId: string,
    newTableId: string,
    reason?: string,
  ) {
    requireOrdersPermission(auth, "orders:update");
    const order = await orderRepository.findById(auth.tenantId, orderId);
    if (!order) throw orderNotFound(orderId);
    assertOrderResourceAccess(auth, order.branchId);
    if (order.status !== "OPEN" || order.type !== "DINE_IN" || !order.tableId) {
      throw orderCannotTransferTable(
        "Only an open dine-in order can be transferred",
      );
    }
    if (order.tableId === newTableId) {
      throw orderCannotTransferTable(
        "The destination must be a different table",
      );
    }
    const [oldTable, newTable] = await Promise.all([
      tableRepository.findById(auth.tenantId, order.tableId),
      tableRepository.findById(auth.tenantId, newTableId),
    ]);
    if (
      !oldTable ||
      !newTable ||
      newTable.branchId !== order.branchId ||
      !newTable.isActive
    ) {
      throw orderCannotTransferTable(
        "The destination table is not available in this branch",
      );
    }
    if (newTable.status !== "AVAILABLE") {
      throw orderCannotTransferTable("The destination table is not available");
    }

    const transferred = await tableRepository.transferOrderTable({
      tenantId: auth.tenantId,
      branchId: order.branchId,
      orderId,
      oldTableId: order.tableId,
      newTableId,
      customerSessionId: order.customerSessionId,
      changedBy: auth.userId,
      oldTableName: oldTable.name,
      newTableName: newTable.name,
      ...(reason !== undefined ? { reason } : {}),
    });
    if (!transferred) {
      throw orderCannotTransferTable(
        "The destination table was claimed by another order",
      );
    }

    const fullOrder = await orderRepository.findById(auth.tenantId, orderId);
    await Promise.all([
      eventBus.publish(
        {
          type: "table.updated",
          payload: transferred.oldTable as unknown as RestaurantTable,
        },
        auth.tenantId,
        order.branchId,
      ),
      eventBus.publish(
        {
          type: "table.updated",
          payload: transferred.newTable as unknown as RestaurantTable,
        },
        auth.tenantId,
        order.branchId,
      ),
      eventBus.publish(
        { type: "order.updated", payload: fullOrder as unknown as Order },
        auth.tenantId,
        order.branchId,
      ),
    ]);
    for (const ticket of fullOrder?.kitchenTickets ?? []) {
      if (ticket.status === "SERVED") continue;
      const detailed = await ticketRepository.findDetailedById(
        auth.tenantId,
        ticket.id,
      );
      if (detailed) {
        await eventBus.publish(
          {
            type: "kitchen.ticket.updated",
            payload: detailed as unknown as KitchenTicket,
          },
          auth.tenantId,
          order.branchId,
        );
      }
    }
    return fullOrder;
  },
  async mergeOrders(
    auth: AuthContext,
    sourceOrderId: string,
    targetOrderId: string,
  ) {
    requireOrdersPermission(auth, "orders:update");
    if (!auth.branchId) throw branchRequiredForOrder();
    const result = await orderRepository.mergeOrders({
      tenantId: auth.tenantId,
      branchId: auth.branchId,
      sourceOrderId,
      targetOrderId,
    });
    if (result.status === "not_found") throw orderNotFound(sourceOrderId);
    if (result.status === "same_order")
      throw orderCannotMerge("An order cannot be merged into itself");
    if (result.status === "closed")
      throw orderCannotMerge(
        "Paid, closed, or cancelled orders cannot be merged",
      );
    if (result.status === "already_merged")
      throw orderCannotMerge(
        "This would create a merge chain or duplicate merge",
      );
    const [source, target] = await Promise.all([
      orderRepository.findById(auth.tenantId, sourceOrderId),
      orderRepository.findById(auth.tenantId, targetOrderId),
    ]);
    await Promise.all([
      eventBus.publish(
        { type: "order.updated", payload: source as unknown as Order },
        auth.tenantId,
        auth.branchId,
      ),
      eventBus.publish(
        { type: "order.updated", payload: target as unknown as Order },
        auth.tenantId,
        auth.branchId,
      ),
    ]);
    return { source, target };
  },
};
