import { and, eq, sql } from "drizzle-orm";
import type { Order } from "@pos/types";
import { db } from "../../db";
import { bills, orders, payments } from "../../db/schema";
import { ValidationError } from "../../core/errors";
import { availabilityRepository } from "../menu/availability/availability.repository";
import { availabilityService } from "../menu/availability/availability.service";
import { inventoryService } from "../inventory/inventory.service";
import { eventBus } from "../../lib/event-bus";
import { orderRepository } from "../orders/order.repository";
import { resolveItems, type OrderItemInput, type PricableMenuItem } from "../orders/order-pricing";
import { customerRepository } from "./customer.repository";
import { customerBranchUnavailable, customerTableNotFound, invalidCustomerSession } from "./customer.errors";

const SESSION_TTL_MINUTES = 12 * 60;

export type CreateCustomerOrderInput = {
  items: OrderItemInput[];
  notes?: string;
};

export type CustomerCheckoutInput = {
  orderId: string;
  method: "CASH";
};

export const customerService = {
  async createSession(qrToken: string) {
    const table = await customerRepository.findTableByQrToken(qrToken);
    if (!table) throw customerTableNotFound();
    if (!table.branch.isActive || !table.branch.dineInEnabled || !table.branch.tablesEnabled) {
      throw customerBranchUnavailable();
    }

    const expiresAt = new Date(Date.now() + SESSION_TTL_MINUTES * 60_000);
    const session = await customerRepository.createSession({
      tenantId: table.tenantId,
      branchId: table.branchId,
      tableId: table.id,
      expiresAt,
    });

    return {
      sessionToken: session.token,
      expiresAt: session.expiresAt,
      restaurant: { id: table.branch.id, name: table.branch.name },
      table: { id: table.id, name: table.name, section: table.section },
    };
  },

  async getSession(token: string) {
    const session = await customerRepository.findSession(token);
    if (!session || session.expiresAt.getTime() <= Date.now()) throw invalidCustomerSession();
    if (!session.branch.isActive || !session.branch.dineInEnabled || !session.branch.tablesEnabled) {
      throw customerBranchUnavailable();
    }
    return session;
  },

  async getMenu(token: string) {
    const session = await this.getSession(token);
    const menu = await customerRepository.listMenu(session.tenantId, session.branchId);
    const effectiveItems = await Promise.all(menu.items.map(async (item) => {
      if (item.branchId !== null) return item;
      const effective = await availabilityService.getEffectiveItem(session.tenantId, item.id, session.branchId);
      if (effective.effectiveStatus !== "ACTIVE" || effective.isHidden) return null;
      return { ...item, basePrice: effective.effectivePrice, taxRate: effective.effectiveTaxRate, prepTimeMinutes: effective.effectivePrepTimeMinutes };
    }));
    return {
      restaurant: { id: session.branch.id, name: session.branch.name, address: session.branch.address },
      table: { id: session.table.id, name: session.table.name, section: session.table.section },
      categories: menu.categories,
      items: effectiveItems.filter((item): item is NonNullable<typeof item> => item !== null),
    };
  },

  async createOrder(token: string, input: CreateCustomerOrderInput) {
    const session = await this.getSession(token);
    const menuItemsData = await availabilityRepository.findByIds(
      session.tenantId,
      input.items.map((i) => i.menuItemId),
      session.branchId,
    );
    const itemMap = new Map(menuItemsData.map((m) => [m.id, m as unknown as PricableMenuItem] as const));
    for (const item of input.items) {
      const effective = await availabilityService.getEffectiveItem(session.tenantId, item.menuItemId, session.branchId);
      if (effective.effectiveStatus !== "ACTIVE" || effective.isHidden) {
        throw new ValidationError(`${effective.name} is not available right now`);
      }
    }
    const { resolved, subtotal, taxAmount } = resolveItems(input.items, itemMap);
    const order = await orderRepository.create({
      tenantId: session.tenantId,
      branchId: session.branchId,
      tableId: session.tableId,
      createdBy: null,
      source: "CUSTOMER_QR",
      customerSessionId: session.id,
      type: "DINE_IN",
      notes: input.notes,
      items: resolved,
      subtotal,
      taxAmount,
      totalAmount: subtotal + taxAmount,
    });

    const fullOrder = await orderRepository.findById(session.tenantId, order.id);
    await eventBus.publish({ type: "order.created", payload: fullOrder as unknown as Order }, session.tenantId, session.branchId);
    await eventBus.publish({ type: "kitchen.ticket.created", payload: { orderId: order.id } }, session.tenantId, session.branchId);

    try {
      await inventoryService.deductForOrderItems(
        session.tenantId,
        session.branchId,
        order.id,
        resolved.map((r) => ({ menuItemId: r.menuItemId, quantity: r.quantity })),
        null,
      );
    } catch (err) {
      console.error("Inventory deduction failed for customer order", order.id, err);
    }

    return fullOrder;
  },

  async checkout(token: string, input: CustomerCheckoutInput) {
    const session = await this.getSession(token);
    const order = await db.query.orders.findFirst({
      where: and(
        eq(orders.id, input.orderId),
        eq(orders.tenantId, session.tenantId),
        eq(orders.branchId, session.branchId),
        eq(orders.customerSessionId, session.id),
      ),
    });
    if (!order) throw new ValidationError("Order does not belong to this customer session");
    if (order.status === "CANCELLED" || order.status === "CLOSED") {
      throw new ValidationError("This order can no longer be checked out");
    }

    return db.transaction(async (tx) => {
      // Serialize checkout attempts for this order. Without an order-scoped
      // lock, two rapid taps or concurrent requests could both observe no
      // pending payment and create duplicate payment rows.
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${order.id}))`);

      const current = await tx.query.orders.findFirst({
        where: eq(orders.id, order.id),
        with: { payments: true },
      });
      if (!current) throw new ValidationError("Order no longer exists");

      const existing = current.payments.find((payment) => payment.status === "PENDING");
      if (existing) {
        return { payment: existing, orderStatus: current.status, paymentRequired: true, method: existing.method as "CASH" };
      }
      const successful = current.payments.find((payment) => payment.status === "SUCCESS");
      if (successful) {
        return { payment: successful, orderStatus: current.status, paymentRequired: false, method: "CASH" as const };
      }

      let bill = await tx.query.bills.findFirst({ where: eq(bills.orderId, current.id) });
      if (!bill) {
        const [createdBill] = await tx.insert(bills).values({
          orderId: current.id,
          subtotal: current.subtotal,
          taxAmount: current.taxAmount,
          discountAmount: current.discountAmount,
          totalAmount: current.totalAmount,
        }).returning();
        bill = createdBill!;
      }
      const [payment] = await tx.insert(payments).values({
        orderId: current.id,
        billId: bill.id,
        method: input.method,
        amount: current.totalAmount,
        status: "PENDING",
        reference: null,
      }).returning();

      return { payment: payment!, orderStatus: current.status, paymentRequired: true, method: input.method };
    });
  },

  async getOrder(token: string, orderId: string) {
    const session = await this.getSession(token);
    const order = await db.query.orders.findFirst({
      where: and(
        eq(orders.id, orderId),
        eq(orders.tenantId, session.tenantId),
        eq(orders.branchId, session.branchId),
        eq(orders.customerSessionId, session.id),
      ),
      with: { items: { with: { modifiers: true } }, kitchenTickets: true, table: true, payments: true },
    });
    if (!order) throw new ValidationError("Order does not belong to this customer session");
    return order;
  },
};
