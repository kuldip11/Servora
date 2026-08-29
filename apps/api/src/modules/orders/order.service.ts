/**
 * Order service — orchestrates repository + branch/table validation +
 * pricing (order-pricing.ts) + status transitions (order-status.machine.ts)
 * + inventory deduction + event publishing. This is the module's biggest
 * service by a wide margin because order creation genuinely touches the
 * most other subsystems (menu, tables, branches, kitchen tickets,
 * inventory) — that breadth is inherent to the domain, not something a
 * file split alone fixes.
 */
import type {
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
import { ValidationError } from "../../core/errors";
import { availabilityRepository } from "../menu/availability/availability.repository";
import { availabilityService } from "../menu/availability/availability.service";
import { tableRepository } from "../tables/table.repository";
import { ticketRepository } from "../kitchen-tickets/ticket.repository";
import { branchRepository } from "../branches/branch.repository";
import { inventoryService } from "../inventory/inventory.service";
import { eventBus } from "../../lib/event-bus";
import { orderRepository } from "./order.repository";
import {
  resolveItems,
  type OrderItemInput,
  type PricableMenuItem,
} from "./order-pricing";
import { assertValidOrderTransition } from "./order-status.machine";
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

// A menu item can be temporarily hidden/out-of-stock via a schedule (e.g.
// "Breakfast items 7-11 AM only") without touching its stored base status,
// or via a branch override (e.g. this branch is out of it, or prices it
// differently) — both are checked in addition to menuItem.isAvailable,
// since either can turn an otherwise-ACTIVE item off for this branch/time.
// getEffectiveItem already applies the full precedence: branch override
// status > schedule status > base status.
async function assertItemsInSchedule(
  tenantId: string,
  branchId: string,
  itemMap: Map<string, PricableMenuItem>,
  requestedItemIds: string[],
): Promise<void> {
  const uniqueIds = Array.from(new Set(requestedItemIds));
  for (const id of uniqueIds) {
    const menuItem = itemMap.get(id);
    if (!menuItem) continue; // resolveItems will raise the not-found error
    const effective = await availabilityService.getEffectiveItem(
      tenantId,
      id,
      branchId,
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
  notes?: string | undefined;
  items: OrderItemInput[];
}

export interface FireTicketInput {
  notes?: string | undefined;
  items: OrderItemInput[];
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

    const menuItemIds = input.items.map((i) => i.menuItemId);
    const menuItemsData = await availabilityRepository.findByIds(
      auth.tenantId,
      menuItemIds,
      branchId,
    );
    const itemMap = new Map(
      menuItemsData.map(
        (m) => [m.id, m as unknown as PricableMenuItem] as const,
      ),
    );

    await assertItemsInSchedule(auth.tenantId, branchId, itemMap, menuItemIds);

    const { resolved, subtotal, taxAmount } = resolveItems(
      input.items,
      itemMap,
    );
    const totalAmount = subtotal + taxAmount;

    const order = await orderRepository.create({
      tenantId: auth.tenantId,
      branchId,
      tableId: input.tableId,
      createdBy: auth.userId,
      type: input.type,
      notes: input.notes,
      items: resolved,
      subtotal,
      taxAmount,
      totalAmount,
    });

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

    // Publish the full ticket so KDS can update its cache immediately without
    // waiting for a follow-up HTTP fetch. Polling remains the recovery path.
    const createdTicket = fullOrder?.kitchenTickets?.[0];
    if (createdTicket) {
      await eventBus.publish(
        { type: "kitchen.ticket.created", payload: createdTicket as any },
        auth.tenantId,
        branchId,
      );
    }

    // Best-effort: a recipe-deduction hiccup shouldn't roll back an order
    // that's already been placed and sent to the kitchen.
    try {
      if (createdTicket)
        await inventoryService.deductForOrderItems(
          auth.tenantId,
          branchId,
          order.id,
          createdTicket.id,
          resolved.map((r) => ({
            menuItemId: r.menuItemId,
            quantity: r.quantity,
          })),
          auth.userId,
        );
    } catch (err) {
      console.error("Inventory deduction failed for order", order.id, err);
    }

    return fullOrder;
  },

  async updateStatus(
    auth: AuthContext,
    orderId: string,
    newStatus: OrderStatus,
    reason?: string | undefined,
  ) {
    requireOrdersPermission(
      auth,
      newStatus === "CANCELLED" ? "orders:cancel" : "orders:update_status",
    );
    const order = await orderRepository.findById(auth.tenantId, orderId);
    if (!order) throw orderNotFound(orderId);
    assertOrderResourceAccess(auth, order.branchId);

    assertValidOrderTransition(order.status, newStatus);

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

    const menuItemIds = input.items.map((i) => i.menuItemId);
    const menuItemsData = await availabilityRepository.findByIds(
      auth.tenantId,
      menuItemIds,
      order.branchId,
    );
    const itemMap = new Map(
      menuItemsData.map(
        (m) => [m.id, m as unknown as PricableMenuItem] as const,
      ),
    );

    await assertItemsInSchedule(
      auth.tenantId,
      order.branchId,
      itemMap,
      menuItemIds,
    );

    const { resolved, subtotal, taxAmount } = resolveItems(
      input.items,
      itemMap,
    );

    const ticket = await orderRepository.fireNewTicket(
      auth.tenantId,
      order.branchId,
      orderId,
      resolved,
      subtotal,
      taxAmount,
      input.notes,
    );

    const fullOrder = await orderRepository.findById(auth.tenantId, orderId);

    await eventBus.publish(
      { type: "order.updated", payload: fullOrder as unknown as Order },
      auth.tenantId,
      order.branchId,
    );
    const createdTicket = fullOrder?.kitchenTickets?.find(
      (candidate: any) => candidate.id === ticket.id,
    );
    if (createdTicket) {
      await eventBus.publish(
        { type: "kitchen.ticket.created", payload: createdTicket as any },
        auth.tenantId,
        order.branchId,
      );
    }

    try {
      await inventoryService.deductForOrderItems(
        auth.tenantId,
        order.branchId,
        orderId,
        ticket.id,
        resolved.map((r) => ({
          menuItemId: r.menuItemId,
          quantity: r.quantity,
        })),
        auth.userId,
      );
    } catch (err) {
      console.error("Inventory deduction failed for order", orderId, err);
    }

    return fullOrder;
  },
};
