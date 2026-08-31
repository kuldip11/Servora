import { and, eq, sql } from "drizzle-orm";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { KitchenTicket, Order, RestaurantTable } from "@pos/types";
import { db } from "../../db";
import { bills, orders, payments, kitchenTickets } from "../../db/schema";
import { ValidationError } from "../../core/errors";
import { availabilityService } from "../menu/availability/availability.service";
import { inventoryService } from "../inventory/inventory.service";
import { eventBus } from "../../lib/event-bus";
import { orderRepository } from "../orders/order.repository";
import {
  pricingPipeline,
  type OrderItemInput,
  type PricedLine,
} from "../orders/pricing/pricing-pipeline";
import { customerRepository } from "./customer.repository";
import { tableRepository } from "../tables/table.repository";
import {
  customerBranchUnavailable,
  customerTableNotFound,
  invalidCustomerSession,
} from "./customer.errors";
import { menuResolver } from "../menu/menus/menu-resolver.service";
import { priceComboOrders, type ComboOrderSelection } from "../menu/combos/combo-order.service";
import { promotionRepository } from "../menu/promotions/promotion.repository";
import { loyaltyRepository } from "../loyalty/loyalty.repository";
import { snapshotOrderLines } from "../orders/order-line-snapshot.service";
import { finalizeWholeActiveOrder, type ExistingLinePricingUpdate, type StoredOrderLineForRepricing } from "../orders/order-repricing";
import { isBillableOrderItem } from "../orders/order-item-billing";

const SESSION_TTL_MINUTES = 12 * 60;

export type CustomerSessionMode = "DINE_IN" | "TAKEAWAY";

export type CreateCustomerOrderInput = {
  items?: OrderItemInput[];
  combos?: ComboOrderSelection[];
  notes?: string;
  couponCode?: string;
  loyaltyPhone?: string;
};

export type CustomerCheckoutInput = {
  orderId: string;
  billId?: string;
  method: "CASH";
};

const razorpayConfig = () => ({
  keyId: process.env["RAZORPAY_KEY_ID"],
  keySecret: process.env["RAZORPAY_KEY_SECRET"],
});

const createRazorpayOrder = async (amount: string, receipt: string) => {
  const { keyId, keySecret } = razorpayConfig();
  if (!keyId || !keySecret)
    throw new ValidationError(
      "Online takeaway payments are not configured for this restaurant",
    );
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: Math.round(Number(amount) * 100),
      currency: "INR",
      receipt,
    }),
  });
  if (!response.ok)
    throw new ValidationError("Unable to initialize online payment");
  return (await response.json()) as {
    id: string;
    amount: number;
    currency: string;
  };
};

const verifyRazorpaySignature = (
  orderId: string,
  paymentId: string,
  signature: string,
) => {
  const secret = process.env["RAZORPAY_KEY_SECRET"];
  if (!secret) return false;
  const expected = createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
};

const fetchRazorpayPayment = async (paymentId: string) => {
  const { keyId, keySecret } = razorpayConfig();
  if (!keyId || !keySecret)
    throw new ValidationError(
      "Online takeaway payments are not configured for this restaurant",
    );
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const response = await fetch(
    `https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`,
    {
      headers: { Authorization: `Basic ${auth}` },
    },
  );
  if (!response.ok)
    throw new ValidationError("Unable to verify payment with Razorpay");
  return (await response.json()) as {
    id: string;
    order_id: string;
    status: string;
    amount: number;
    currency: string;
  };
};

export const customerService = {
  async createSession(qrToken: string) {
    const table = await customerRepository.findTableByQrToken(qrToken);
    if (table) {
      if (
        !table.branch.isActive ||
        !table.branch.dineInEnabled ||
        !table.branch.tablesEnabled
      ) {
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

    const branch =
      await customerRepository.findBranchByTakeawayQrToken(qrToken);
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
    if (!session || session.expiresAt.getTime() <= Date.now())
      throw invalidCustomerSession();
    if (
      !session.branch.isActive ||
      (session.mode === "DINE_IN" &&
        (!session.branch.dineInEnabled || !session.branch.tablesEnabled)) ||
      (session.mode === "TAKEAWAY" && !session.branch.takeawayEnabled)
    ) {
      throw customerBranchUnavailable();
    }
    return session;
  },

  async getMenu(token: string) {
    const session = await this.getSession(token);
    const activeMenus = await menuResolver.getActiveMenus(
      session.tenantId, session.branchId, "CUSTOMER_QR", session.mode, new Date(),
    );
    const activeItemIds = new Set(activeMenus.flatMap((menu) => menu.memberships.map((membership) => membership.menuItemId)));
    const menu = await customerRepository.listMenu(
      session.tenantId,
      session.branchId,
    );
    const comboRows = await db.query.combos.findMany({
      where: (table, { and, eq }) =>
        and(eq(table.tenantId, session.tenantId), eq(table.status, "ACTIVE")),
      with: { slots: { with: { options: true } } },
    });
    const asOf = new Date();
    const effectiveItems = await Promise.all(
      menu.items.map(async (item) => {
        const effective = await availabilityService.getEffectiveItem(
          session.tenantId,
          item.id,
          session.branchId,
          {
            channel: "CUSTOMER_QR",
            fulfillmentType: session.mode,
            asOf,
          },
        );
        if (effective.effectiveStatus !== "ACTIVE" || effective.isHidden)
          return null;
        return {
          ...item,
          basePrice: effective.effectivePrice,
          taxRate: effective.effectiveTaxRate,
          prepTimeMinutes: effective.effectivePrepTimeMinutes,
        };
      }),
    );
    return {
      restaurant: {
        id: session.branch.id,
        name: session.branch.name,
        address: session.branch.address,
      },
      mode: session.mode,
      table: session.table
        ? {
            id: session.table.id,
            name: session.table.name,
            section: session.table.section,
          }
        : null,
      categories: menu.categories,
      menus: activeMenus,
      combos: comboRows
        .map((combo) => ({
          ...combo,
          slots: combo.slots.map((slot) => ({
            ...slot,
            options: slot.options.filter((option) =>
              activeItemIds.has(option.menuItemId),
            ),
          })),
        }))
        .filter((combo) =>
          combo.slots.every(
            (slot) => slot.options.length >= slot.minSelections,
          ),
        ),
      items: effectiveItems.filter(
        (item): item is NonNullable<typeof item> => item !== null && activeItemIds.has(item.id),
      ),
    };
  },

  async createOrder(
    token: string,
    input: CreateCustomerOrderInput,
    customerRequestId?: string,
  ) {
    const session = await this.getSession(token);
    const normalizedItems = (input.items ?? []).map((item) => ({
      ...item,
      fulfillmentType:
        session.mode === "TAKEAWAY"
          ? ("TAKEAWAY" as const)
          : (item.fulfillmentType ?? "DINE_IN"),
    }));
    if (normalizedItems.length === 0 && !(input.combos?.length)) {
      throw new ValidationError("Order requires at least one item or combo");
    }

    const existingSummary = await customerRepository.findOpenOrderBySession(
      session.tenantId, session.branchId, session.id,
    );
    const existing = existingSummary
      ? await orderRepository.findById(session.tenantId, existingSummary.id)
      : null;
    let associatedCustomerId = existing?.customerId ?? null;
    if (input.loyaltyPhone?.trim()) {
      const loyaltyMatches = await loyaltyRepository.findCustomersByPhone(
        session.tenantId, input.loyaltyPhone.trim(),
      );
      if (loyaltyMatches.length === 0) {
        throw new ValidationError("No loyalty customer matches that phone number");
      }
      if (loyaltyMatches.length > 1) {
        throw new ValidationError("That loyalty phone number is ambiguous; ask staff to update the customer record");
      }
      const loyaltyCustomer = loyaltyMatches[0]!;
      if (associatedCustomerId && associatedCustomerId !== loyaltyCustomer.id) {
        throw new ValidationError("This open order is already linked to a different loyalty customer");
      }
      associatedCustomerId = loyaltyCustomer.id;
    }

    const asOf = new Date();
    const pricingContext = {
      tenantId: session.tenantId,
      branchId: session.branchId,
      channel: "CUSTOMER_QR" as const,
      fulfillmentType: session.mode,
      asOf,
      ...(associatedCustomerId ? { customerId: associatedCustomerId } : {}),
    };

    const regular = await pricingPipeline.price(pricingContext, normalizedItems);
    const combo = await priceComboOrders(pricingContext, input.combos ?? []);
    const unresolvedLines = [...regular.lines, ...combo.lines];
    const realLines = unresolvedLines.flatMap((line) =>
      line.menuItemId === null
        ? []
        : [{ menuItemId: line.menuItemId, quantity: line.quantity }],
    );

    const activeCustomerItemIds = await menuResolver.getActiveItemIds(
      session.tenantId,
      session.branchId,
      "CUSTOMER_QR",
      session.mode,
      asOf,
    );
    for (const line of realLines) {
      if (!activeCustomerItemIds.has(line.menuItemId)) {
        throw new ValidationError(
          "This item is not on an active menu for your order",
        );
      }
      const effective = await availabilityService.getEffectiveItem(
        session.tenantId,
        line.menuItemId,
        session.branchId,
        {
          channel: "CUSTOMER_QR",
          fulfillmentType: session.mode,
          asOf,
        },
      );
      if (effective.effectiveStatus !== "ACTIVE" || effective.isHidden) {
        throw new ValidationError(
          "This item is not available right now",
        );
      }
    }

    const stockCheck = await inventoryService.validateStock(
      session.tenantId,
      session.branchId,
      realLines,
    );
    if (!stockCheck.valid) {
      throw new ValidationError(
        `Some requested items are out of stock: ${stockCheck.insufficient.map((item) => item.name).join(", ")}`,
      );
    }

    const priorRedemptions = existing
      ? await promotionRepository.listRedemptionsForOrder(existing.id)
      : [];
    const continuedPromotionIds = priorRedemptions.map((entry) => entry.promotionId);

    let promoted: Awaited<ReturnType<typeof pricingPipeline.finalize>>;
    let existingPricingUpdates: ExistingLinePricingUpdate[] = [];
    let newFinalLines: PricedLine[];
    if (existing) {
      const whole = await finalizeWholeActiveOrder(
        pricingContext,
        existing.items.filter((item) => isBillableOrderItem(item)) as StoredOrderLineForRepricing[],
        unresolvedLines,
        {
          ...(input.couponCode ? { couponCode: input.couponCode } : {}),
          ...(continuedPromotionIds.length ? { promotionIds: continuedPromotionIds } : {}),
          ...(associatedCustomerId ? { customerId: associatedCustomerId } : {}),
        },
      );
      promoted = whole;
      existingPricingUpdates = whole.existingPricingUpdates;
      newFinalLines = whole.newLines;
    } else {
      promoted = await pricingPipeline.finalize(
        pricingContext,
        unresolvedLines,
        {
          ...(input.couponCode ? { couponCode: input.couponCode } : {}),
          ...(associatedCustomerId ? { customerId: associatedCustomerId } : {}),
        },
      );
      newFinalLines = promoted.lines;
    }
    const resolved = await snapshotOrderLines(session.tenantId, newFinalLines, {
      branchId: session.branchId,
      channel: "CUSTOMER_QR",
      fulfillmentType: session.mode,
      asOf,
    });
    const subtotal = promoted.subtotal;
    const discountAmount = promoted.discountAmount;
    const taxAmount = promoted.taxAmount;

    let orderId: string;
    let createdNewOrder = false;
    let roundCreated = false;
    if (existing) {
      if (existing.status === "BILL_REQUESTED") {
        throw new ValidationError(
          "This order is already being settled. Payment must be completed before ordering more.",
        );
      }
      if (session.mode === "TAKEAWAY")
        throw new ValidationError(
          "This takeaway order has already been submitted",
        );
      let duplicateSubmission = false;
      if (customerRequestId) {
        duplicateSubmission =
          !!(await customerRepository.findCustomerRequestTicket(
            existing.id,
            customerRequestId,
          ));
      }
      if (!duplicateSubmission) {
        try {
          await orderRepository.fireNewTicket(
            session.tenantId,
            session.branchId,
            existing.id,
            resolved,
            subtotal,
            taxAmount,
            input.notes,
            customerRequestId,
            {
              existingPricingUpdates,
              absoluteTotals: {
                subtotal: promoted.subtotal,
                taxAmount: promoted.taxAmount,
                discountAmount: promoted.discountAmount,
                serviceChargeAmount: promoted.serviceChargeAmount,
                roundingAdjustment: promoted.roundingAdjustment,
                totalAmount: promoted.totalAmount,
              },
              promotionRedemptions: promoted.redemptions,
              replacePromotionRedemptions: true,
              ...(associatedCustomerId ? { customerId: associatedCustomerId } : {}),
            },
          );
          roundCreated = true;
        } catch (error) {
          if ((error as { code?: string })?.code !== "23505") throw error;
          duplicateSubmission = true;
        }
      }
      orderId = existing.id;
      if (duplicateSubmission) createdNewOrder = false;
    } else {
      try {
        const order = await orderRepository.create({
          tenantId: session.tenantId,
          branchId: session.branchId,
          ...(session.tableId ? { tableId: session.tableId } : {}),
          createdBy: null,
          source: "CUSTOMER_QR",
          customerSessionId: session.id,
          customerId: associatedCustomerId,
          type: session.mode === "TAKEAWAY" ? "TAKEAWAY" : "DINE_IN",
          notes: input.notes,
          items: resolved,
          subtotal,
          taxAmount,
          discountAmount,
          serviceChargeAmount: promoted.serviceChargeAmount,
          roundingAdjustment: promoted.roundingAdjustment,
          totalAmount: promoted.totalAmount,
          promotionRedemptions: promoted.redemptions,
          initialTicketStatus:
            session.mode === "TAKEAWAY" ? "PENDING_PAYMENT" : "FIRED",
          customerRequestId: customerRequestId ?? null,
          resolutionAsOf: asOf,
        });
        orderId = order.id;
        createdNewOrder = true;
        roundCreated = true;
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
        let duplicateSubmission = false;
        if (customerRequestId) {
          duplicateSubmission =
            !!(await customerRepository.findCustomerRequestTicket(
              concurrentOrder.id,
              customerRequestId,
            ));
        }
        if (!duplicateSubmission) {
          try {
            const concurrentFull = await orderRepository.findById(session.tenantId, concurrentOrder.id);
            if (!concurrentFull) throw error;
            const concurrentCustomerId = concurrentFull.customerId ?? associatedCustomerId;
            if (concurrentFull.customerId && associatedCustomerId && concurrentFull.customerId !== associatedCustomerId) {
              throw new ValidationError("This open order is already linked to a different loyalty customer");
            }
            const concurrentContext = {
              ...pricingContext,
              ...(concurrentCustomerId ? { customerId: concurrentCustomerId } : {}),
            };
            const concurrentRedemptions = await promotionRepository.listRedemptionsForOrder(concurrentOrder.id);
            const concurrentWhole = await finalizeWholeActiveOrder(
              concurrentContext,
              concurrentFull.items.filter((item) => isBillableOrderItem(item)) as StoredOrderLineForRepricing[],
              unresolvedLines,
              {
                ...(input.couponCode ? { couponCode: input.couponCode } : {}),
                ...(concurrentRedemptions.length ? { promotionIds: concurrentRedemptions.map((entry) => entry.promotionId) } : {}),
                ...(concurrentCustomerId ? { customerId: concurrentCustomerId } : {}),
              },
            );
            const concurrentResolved = await snapshotOrderLines(
              session.tenantId, concurrentWhole.newLines, {
                branchId: session.branchId,
                channel: "CUSTOMER_QR",
                fulfillmentType: session.mode,
                asOf,
              },
            );
            await orderRepository.fireNewTicket(
              session.tenantId,
              session.branchId,
              concurrentOrder.id,
              concurrentResolved,
              unresolvedLines.reduce((sum, line) => sum + line.subtotal, 0),
              0,
              input.notes,
              customerRequestId,
              {
                existingPricingUpdates: concurrentWhole.existingPricingUpdates,
                absoluteTotals: {
                  subtotal: concurrentWhole.subtotal,
                  taxAmount: concurrentWhole.taxAmount,
                  discountAmount: concurrentWhole.discountAmount,
                  serviceChargeAmount: concurrentWhole.serviceChargeAmount,
                  roundingAdjustment: concurrentWhole.roundingAdjustment,
                  totalAmount: concurrentWhole.totalAmount,
                },
                promotionRedemptions: concurrentWhole.redemptions,
                replacePromotionRedemptions: true,
                ...(concurrentCustomerId ? { customerId: concurrentCustomerId } : {}),
              },
            );
            roundCreated = true;
          } catch (nestedError) {
            if ((nestedError as { code?: string })?.code !== "23505")
              throw nestedError;
          }
        }
        orderId = concurrentOrder.id;
      }

      if (createdNewOrder && session.mode === "DINE_IN" && session.tableId) {
        // The first customer tab owns the table until its lifecycle is closed.
        const updatedTable = await tableRepository.update(
          session.tenantId,
          session.tableId,
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
            session.tenantId,
            session.branchId,
          );
        }
      }
    }

    if (session.mode === "TAKEAWAY" && createdNewOrder) {
      await this.initiateTakeawayPayment(
        session.tenantId,
        session.branchId,
        orderId,
      );
    }

    const fullOrder = await orderRepository.findById(session.tenantId, orderId);
    await eventBus.publish(
      {
        type: createdNewOrder ? "order.created" : "order.updated",
        payload: fullOrder as unknown as Order,
      },
      session.tenantId,
      session.branchId,
    );
    // A public takeaway order is intentionally invisible to the kitchen until
    // a verified payment releases its PENDING_PAYMENT ticket. Dine-in orders
    // can fire immediately.
    const firedTickets = (fullOrder?.kitchenTickets ?? []).filter(
      (ticket) => ticket.status === "FIRED",
    );
    const newestTicket = firedTickets.at(-1);
    if (session.mode !== "TAKEAWAY") {
      if (newestTicket) {
        await eventBus.publish(
          { type: "kitchen.ticket.created", payload: newestTicket as unknown as KitchenTicket },
          session.tenantId,
          session.branchId,
        );
      }
    }

    try {
      if (
        roundCreated &&
        newestTicket &&
        (session.mode !== "TAKEAWAY" || !createdNewOrder)
      )
        await inventoryService.deductForOrderItems(
          session.tenantId,
          session.branchId,
          orderId,
          newestTicket.id,
          newestTicket.items.flatMap((item) =>
            item.menuItemId === null
              ? []
              : [{
                  orderItemId: item.id,
                  menuItemId: item.menuItemId,
                  variantId: item.variantId,
                  quantity: item.quantity,
                  selectedOptions: item.modifiers.flatMap((modifier) =>
                    modifier.modifierId == null ? [] : [{ optionId: modifier.modifierId, quantity: modifier.quantity }],
                  ),
                }],
          ),
          null,
        );
    } catch (err) {
      console.error(
        "Inventory deduction failed for customer order",
        orderId,
        err,
      );
    }

    return fullOrder;
  },

  async initiateTakeawayPayment(
    tenantId: string,
    branchId: string,
    orderId: string,
  ) {
    return db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${orderId}))`);
      const order = await tx.query.orders.findFirst({
        where: and(
          eq(orders.id, orderId),
          eq(orders.tenantId, tenantId),
          eq(orders.branchId, branchId),
          eq(orders.type, "TAKEAWAY"),
        ),
        with: { payments: true },
      });
      if (!order) throw new ValidationError("Takeaway order was not found");
      if (["PAID", "CLOSED", "CANCELLED"].includes(order.status))
        throw new ValidationError("This order can no longer accept payment");
      const pending = order.payments.find(
        (payment) =>
          payment.method === "RAZORPAY" &&
          payment.status === "PENDING" &&
          payment.gatewayOrderId,
      );
      if (pending) return pending;

      const bill =
        (await tx.query.bills.findFirst({
          where: eq(bills.orderId, orderId),
        })) ??
        (
          await tx
            .insert(bills)
            .values({
              orderId,
              subtotal: order.subtotal,
              taxAmount: order.taxAmount,
              discountAmount: order.discountAmount,
              serviceChargeAmount: order.serviceChargeAmount,
              roundingAdjustment: order.roundingAdjustment,
              totalAmount: order.totalAmount,
            })
            .returning()
        )[0];
      if (!bill) throw new ValidationError("Unable to initialize order bill");

      // Gateway I/O is deliberately outside the DB transaction in the normal
      // service path, but the order-scoped lock prevents two API callers from
      // creating competing payment rows. This method is only called after the
      // order exists and the amount has been server-calculated.
      const gatewayOrder = await createRazorpayOrder(
        order.totalAmount,
        orderId,
      );
      const [payment] = await tx
        .insert(payments)
        .values({
          orderId,
          billId: bill.id,
          method: "RAZORPAY",
          amount: order.totalAmount,
          status: "PENDING",
          reference: gatewayOrder.id,
          gatewayOrderId: gatewayOrder.id,
          metadata: JSON.stringify({
            gateway: "RAZORPAY",
            gatewayOrderId: gatewayOrder.id,
          }),
        })
        .returning();
      return payment!;
    });
  },

  async verifyTakeawayPayment(
    token: string,
    input: {
      orderId: string;
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
    },
  ) {
    const session = await this.getSession(token);
    if (session.mode !== "TAKEAWAY")
      throw new ValidationError(
        "Online payment is only required for takeaway orders",
      );
    const order = await db.query.orders.findFirst({
      where: and(
        eq(orders.id, input.orderId),
        eq(orders.tenantId, session.tenantId),
        eq(orders.branchId, session.branchId),
        eq(orders.customerSessionId, session.id),
      ),
      with: { payments: true, kitchenTickets: true, items: { with: { modifiers: true } } },
    });
    if (!order)
      throw new ValidationError(
        "Order does not belong to this customer session",
      );
    const payment = order.payments.find(
      (value) =>
        value.gatewayOrderId === input.razorpayOrderId ||
        value.reference === input.razorpayOrderId ||
        value.metadata?.includes(
          `\"gatewayOrderId\":\"${input.razorpayOrderId}\"`,
        ),
    );
    if (!payment) throw new ValidationError("Payment attempt was not found");
    if (payment.status === "SUCCESS")
      return orderRepository.findById(session.tenantId, order.id);
    if (payment.status !== "PENDING")
      throw new ValidationError("Payment attempt is no longer payable");
    if (
      !verifyRazorpaySignature(
        input.razorpayOrderId,
        input.razorpayPaymentId,
        input.razorpaySignature,
      )
    )
      throw new ValidationError("Payment verification failed");

    const gatewayPayment = await fetchRazorpayPayment(input.razorpayPaymentId);
    if (
      gatewayPayment.order_id !== input.razorpayOrderId ||
      gatewayPayment.status !== "captured" ||
      gatewayPayment.currency !== "INR" ||
      gatewayPayment.amount !== Math.round(Number(payment.amount) * 100)
    ) {
      throw new ValidationError(
        "Razorpay payment is not captured for this order",
      );
    }

    const shouldRelease = await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${order.id}))`,
      );
      const current = await tx.query.payments.findFirst({
        where: eq(payments.id, payment.id),
      });
      if (!current) throw new ValidationError("Payment attempt was not found");
      if (current.status === "SUCCESS") return false;
      await tx
        .update(payments)
        .set({
          status: "SUCCESS",
          reference: input.razorpayPaymentId,
          gatewayOrderId: input.razorpayOrderId,
          gatewayPaymentId: input.razorpayPaymentId,
          metadata: JSON.stringify({
            gateway: "RAZORPAY",
            gatewayOrderId: input.razorpayOrderId,
            gatewayPaymentId: input.razorpayPaymentId,
          }),
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id));
      await tx
        .update(kitchenTickets)
        .set({ status: "FIRED", updatedAt: new Date() })
        .where(
          and(
            eq(kitchenTickets.orderId, order.id),
            eq(kitchenTickets.status, "PENDING_PAYMENT"),
          ),
        );
      return true;
    });

    if (shouldRelease) {
      try {
        const releasedIds = new Set(
          order.kitchenTickets
            .filter((ticket) => ticket.status === "PENDING_PAYMENT")
            .map((ticket) => ticket.id),
        );
        for (const ticketId of releasedIds) {
          const ticketItems = order.items.filter(
            (item) => item.kitchenTicketId === ticketId,
          );
          await inventoryService.deductForOrderItems(
            session.tenantId,
            session.branchId,
            order.id,
            ticketId,
            ticketItems.flatMap((item) =>
              item.menuItemId === null
                ? []
                : [{
                    orderItemId: item.id,
                    menuItemId: item.menuItemId,
                    variantId: item.variantId,
                    quantity: item.quantity,
                    selectedOptions: item.modifiers.flatMap((modifier) =>
                      modifier.modifierId == null ? [] : [{ optionId: modifier.modifierId, quantity: modifier.quantity }],
                    ),
                  }],
            ),
            null,
          );
        }
      } catch (err) {
        console.error(
          "Inventory deduction failed after takeaway payment",
          order.id,
          err,
        );
      }
      const updated = await orderRepository.findById(
        session.tenantId,
        order.id,
      );
      await eventBus.publish(
        { type: "order.updated", payload: updated as unknown as Order },
        session.tenantId,
        session.branchId,
      );
      const releasedTickets = (updated?.kitchenTickets ?? []).filter(
        (ticket) => ticket.status === "FIRED",
      );
      for (const releasedTicket of releasedTickets) {
        await eventBus.publish(
          { type: "kitchen.ticket.created", payload: releasedTicket as unknown as KitchenTicket },
          session.tenantId,
          session.branchId,
        );
      }
      return updated;
    }
    return orderRepository.findById(session.tenantId, order.id);
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
    if (!order)
      throw new ValidationError(
        "Order does not belong to this customer session",
      );
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
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${order.id}))`,
      );

      const current = await tx.query.orders.findFirst({
        where: eq(orders.id, order.id),
        with: { payments: true },
      });
      if (!current) throw new ValidationError("Order no longer exists");

      const orderBills = await tx.query.bills.findMany({ where: eq(bills.orderId, current.id) });
      const bill = input.billId
        ? orderBills.find((candidate) => candidate.id === input.billId)
        : orderBills.length === 1 ? orderBills[0] : undefined;
      if (orderBills.length > 1 && !bill) throw new ValidationError("Select the bill to check out");
      const existing = current.payments.find(
        (payment) => payment.status === "PENDING" && (!bill || payment.billId === bill.id),
      );
      if (existing) {
        return {
          payment: existing,
          orderStatus: current.status,
          paymentRequired: true,
          method: existing.method as "CASH",
        };
      }
      const successful = current.payments.find(
        (payment) => payment.status === "SUCCESS" && (!bill || payment.billId === bill.id),
      );
      if (successful) {
        return {
          payment: successful,
          orderStatus: current.status,
          paymentRequired: false,
          method: "CASH" as const,
        };
      }

      let selectedBill = bill;
      if (!selectedBill) {
        const [createdBill] = await tx
          .insert(bills)
          .values({
            orderId: current.id,
            subtotal: current.subtotal,
            taxAmount: current.taxAmount,
            discountAmount: current.discountAmount,
            serviceChargeAmount: current.serviceChargeAmount,
            roundingAdjustment: current.roundingAdjustment,
            totalAmount: current.totalAmount,
          })
          .returning();
        selectedBill = createdBill!;
      }
      const [payment] = await tx
        .insert(payments)
        .values({
          orderId: current.id,
          billId: selectedBill.id,
          method: input.method,
          amount: selectedBill.totalAmount,
          status: "PENDING",
          reference: null,
        })
        .returning();

      return {
        payment: payment!,
        orderStatus: current.status,
        paymentRequired: true,
        method: input.method,
      };
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
      with: {
        items: { with: { modifiers: true } },
        kitchenTickets: true,
        table: true,
        payments: true,
        bills: { with: { payments: true, itemAssignments: true } },
      },
    });
    if (!order)
      throw new ValidationError(
        "Order does not belong to this customer session",
      );
    return order;
  },
};
