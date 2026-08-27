import { and, eq, sql } from "drizzle-orm";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Order } from "@pos/types";
import { db } from "../../db";
import { bills, orders, payments, kitchenTickets } from "../../db/schema";
import { ValidationError } from "../../core/errors";
import { availabilityRepository } from "../menu/availability/availability.repository";
import { availabilityService } from "../menu/availability/availability.service";
import { inventoryService } from "../inventory/inventory.service";
import { eventBus } from "../../lib/event-bus";
import { orderRepository } from "../orders/order.repository";
import { resolveItems, type OrderItemInput, type PricableMenuItem } from "../orders/order-pricing";
import { customerRepository } from "./customer.repository";
import { tableRepository } from "../tables/table.repository";
import type { RestaurantTable } from "@pos/types";
import { customerBranchUnavailable, customerTableNotFound, invalidCustomerSession } from "./customer.errors";

const SESSION_TTL_MINUTES = 12 * 60;

export type CustomerSessionMode = "DINE_IN" | "TAKEAWAY";

export type CreateCustomerOrderInput = {
  items: OrderItemInput[];
  notes?: string;
};

export type CustomerCheckoutInput = {
  orderId: string;
  method: "CASH";
};

const razorpayConfig = () => ({
  keyId: process.env["RAZORPAY_KEY_ID"],
  keySecret: process.env["RAZORPAY_KEY_SECRET"],
});

const createRazorpayOrder = async (amount: string, receipt: string) => {
  const { keyId, keySecret } = razorpayConfig();
  if (!keyId || !keySecret) throw new ValidationError("Online takeaway payments are not configured for this restaurant");
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({ amount: Math.round(Number(amount) * 100), currency: "INR", receipt }),
  });
  if (!response.ok) throw new ValidationError("Unable to initialize online payment");
  return (await response.json()) as { id: string; amount: number; currency: string };
};

const verifyRazorpaySignature = (orderId: string, paymentId: string, signature: string) => {
  const secret = process.env["RAZORPAY_KEY_SECRET"];
  if (!secret) return false;
  const expected = createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
};

export const customerService = {
  async createSession(qrToken: string) {
    const table = await customerRepository.findTableByQrToken(qrToken);
    if (table) {
      if (!table.branch.isActive || !table.branch.dineInEnabled || !table.branch.tablesEnabled) {
        throw customerBranchUnavailable();
      }
      const expiresAt = new Date(Date.now() + SESSION_TTL_MINUTES * 60_000);
      const session = await customerRepository.createSession({
        tenantId: table.tenantId,
        branchId: table.branchId,
        tableId: table.id,
        mode: "DINE_IN",
        expiresAt,
      });
      return {
        sessionToken: session.token,
        expiresAt: session.expiresAt,
        mode: "DINE_IN" as const,
        restaurant: { id: table.branch.id, name: table.branch.name },
        table: { id: table.id, name: table.name, section: table.section },
      };
    }

    const branch = await customerRepository.findBranchByTakeawayQrToken(qrToken);
    if (!branch || !branch.takeawayEnabled) throw customerTableNotFound();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MINUTES * 60_000);
    const session = await customerRepository.createSession({
      tenantId: branch.tenantId,
      branchId: branch.id,
      tableId: null,
      mode: "TAKEAWAY",
      expiresAt,
    });
    return {
      sessionToken: session.token,
      expiresAt: session.expiresAt,
      mode: "TAKEAWAY" as const,
      restaurant: { id: branch.id, name: branch.name },
      table: null,
    };
  },

  async getSession(token: string) {
    const session = await customerRepository.findSession(token);
    if (!session || session.expiresAt.getTime() <= Date.now()) throw invalidCustomerSession();
    if (!session.branch.isActive || (session.mode === "DINE_IN" && (!session.branch.dineInEnabled || !session.branch.tablesEnabled)) || (session.mode === "TAKEAWAY" && !session.branch.takeawayEnabled)) {
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
      mode: session.mode,
      table: session.table ? { id: session.table.id, name: session.table.name, section: session.table.section } : null,
      categories: menu.categories,
      items: effectiveItems.filter((item): item is NonNullable<typeof item> => item !== null),
    };
  },

  async createOrder(token: string, input: CreateCustomerOrderInput) {
    const session = await this.getSession(token);
    const normalizedInput: CreateCustomerOrderInput = {
      ...input,
      items: input.items.map((item) => ({
        ...item,
        fulfillmentType: session.mode === "TAKEAWAY" ? "TAKEAWAY" : (item.fulfillmentType ?? "DINE_IN"),
      })),
    };
    const menuItemsData = await availabilityRepository.findByIds(
      session.tenantId,
      normalizedInput.items.map((i) => i.menuItemId),
      session.branchId,
    );
    const itemMap = new Map(menuItemsData.map((m) => [m.id, m as unknown as PricableMenuItem] as const));
    for (const item of normalizedInput.items) {
      const effective = await availabilityService.getEffectiveItem(session.tenantId, item.menuItemId, session.branchId);
      if (effective.effectiveStatus !== "ACTIVE" || effective.isHidden) {
        throw new ValidationError(`${effective.name} is not available right now`);
      }
    }
    const { resolved, subtotal, taxAmount } = resolveItems(normalizedInput.items, itemMap);
    const existing = await customerRepository.findOpenOrderBySession(
      session.tenantId,
      session.branchId,
      session.id,
    );

    let orderId: string;
    let createdNewOrder = false;
    if (existing) {
      if (session.mode === "TAKEAWAY") throw new ValidationError("This takeaway order has already been submitted");
      await orderRepository.fireNewTicket(
        session.tenantId,
        session.branchId,
        existing.id,
        resolved,
        subtotal,
        taxAmount,
        normalizedInput.notes,
      );
      orderId = existing.id;
    } else {
      try {
        const order = await orderRepository.create({
          tenantId: session.tenantId,
          branchId: session.branchId,
          tableId: session.tableId,
          createdBy: null,
          source: "CUSTOMER_QR",
          customerSessionId: session.id,
          type: session.mode === "TAKEAWAY" ? "TAKEAWAY" : "DINE_IN",
          notes: normalizedInput.notes,
          items: resolved,
          subtotal,
          taxAmount,
          totalAmount: subtotal + taxAmount,
          initialTicketStatus: session.mode === "TAKEAWAY" ? "PENDING_PAYMENT" : "FIRED",
        });
        orderId = order.id;
        createdNewOrder = true;
      } catch (error) {
        // The database's active-tab unique index closes the race between two
        // rapid submissions that both observed no existing order. If another
        // request won that race, append this request as the next round.
        if ((error as { code?: string })?.code !== "23505") throw error;
        const concurrentOrder = await customerRepository.findOpenOrderBySession(
          session.tenantId,
          session.branchId,
          session.id,
        );
        if (!concurrentOrder) throw error;
        await orderRepository.fireNewTicket(
          session.tenantId,
          session.branchId,
          concurrentOrder.id,
          resolved,
          subtotal,
          taxAmount,
          input.notes,
        );
        orderId = concurrentOrder.id;
      }

      if (createdNewOrder && session.mode === "DINE_IN" && session.tableId) {
        // The first customer tab owns the table until its lifecycle is closed.
        const updatedTable = await tableRepository.update(session.tenantId, session.tableId, {
          status: "OCCUPIED",
        });
        if (updatedTable) {
          await eventBus.publish(
            { type: "table.updated", payload: updatedTable as unknown as RestaurantTable },
            session.tenantId,
            session.branchId,
          );
        }
      }
    }

    if (session.mode === "TAKEAWAY" && createdNewOrder) {
      const gatewayOrder = await createRazorpayOrder((subtotal + taxAmount).toFixed(2), orderId);
      await db.transaction(async (tx) => {
        const currentBill = await tx.query.bills.findFirst({ where: eq(bills.orderId, orderId) });
        const bill = currentBill ?? (await tx.insert(bills).values({
          orderId, subtotal: subtotal.toFixed(2), taxAmount: taxAmount.toFixed(2), discountAmount: "0", totalAmount: (subtotal + taxAmount).toFixed(2),
        }).returning())[0];
        await tx.insert(payments).values({ orderId, billId: bill!.id, method: "RAZORPAY", amount: (subtotal + taxAmount).toFixed(2), status: "PENDING", reference: gatewayOrder.id, metadata: JSON.stringify({ gateway: "RAZORPAY", gatewayOrderId: gatewayOrder.id }) });
      });
    }

    const fullOrder = await orderRepository.findById(session.tenantId, orderId);
    await eventBus.publish({ type: createdNewOrder ? "order.created" : "order.updated", payload: fullOrder as unknown as Order }, session.tenantId, session.branchId);
    await eventBus.publish({ type: "kitchen.ticket.created", payload: { orderId } }, session.tenantId, session.branchId);

    try {
      if (session.mode !== "TAKEAWAY" || !createdNewOrder) await inventoryService.deductForOrderItems(
        session.tenantId,
        session.branchId,
        orderId,
        resolved.map((r) => ({ menuItemId: r.menuItemId, quantity: r.quantity })),
        null,
      );
    } catch (err) {
      console.error("Inventory deduction failed for customer order", orderId, err);
    }

    return fullOrder;
  },

  async verifyTakeawayPayment(token: string, input: { orderId: string; razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) {
    const session = await this.getSession(token);
    if (session.mode !== "TAKEAWAY") throw new ValidationError("Online payment is only required for takeaway orders");
    const order = await db.query.orders.findFirst({ where: and(eq(orders.id, input.orderId), eq(orders.tenantId, session.tenantId), eq(orders.branchId, session.branchId), eq(orders.customerSessionId, session.id)), with: { payments: true, kitchenTickets: true, items: true } });
    if (!order) throw new ValidationError("Order does not belong to this customer session");
    const payment = order.payments.find((value) => value.reference === input.razorpayOrderId && value.status === "PENDING");
    if (!payment) throw new ValidationError("Payment attempt was not found or has already been completed");
    if (!verifyRazorpaySignature(input.razorpayOrderId, input.razorpayPaymentId, input.razorpaySignature)) throw new ValidationError("Payment verification failed");

    await db.transaction(async (tx) => {
      await tx.update(payments).set({ status: "SUCCESS", reference: input.razorpayPaymentId, metadata: JSON.stringify({ gateway: "RAZORPAY", gatewayOrderId: input.razorpayOrderId }), updatedAt: new Date() }).where(eq(payments.id, payment.id));
      await tx.update(kitchenTickets).set({ status: "FIRED", updatedAt: new Date() }).where(and(eq(kitchenTickets.orderId, order.id), eq(kitchenTickets.status, "PENDING_PAYMENT")));
    });

    try {
      await inventoryService.deductForOrderItems(session.tenantId, session.branchId, order.id, order.items.map((item) => ({ menuItemId: item.menuItemId, quantity: item.quantity })), null);
    } catch (err) { console.error("Inventory deduction failed after takeaway payment", order.id, err); }
    const updated = await orderRepository.findById(session.tenantId, order.id);
    await eventBus.publish({ type: "order.updated", payload: updated as unknown as Order }, session.tenantId, session.branchId);
    await eventBus.publish({ type: "kitchen.ticket.created", payload: { orderId: order.id } }, session.tenantId, session.branchId);
    return updated;
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
    if (order.status !== "BILL_REQUESTED") {
      throw new ValidationError("Request the bill before making a payment");
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
