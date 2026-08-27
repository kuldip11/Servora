import { and, eq, sql } from "drizzle-orm";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Order } from "@pos/types";
import { db } from "../../db";
import { paymentWebhookEvents, payments, kitchenTickets } from "../../db/schema";
import { inventoryService } from "../inventory/inventory.service";
import { eventBus } from "../../lib/event-bus";
import { orderRepository } from "../orders/order.repository";
import { redis, REDIS_QUEUES } from "../../lib/redis";

function verifyWebhookSignature(rawBody: string, signature: string, secret: string) {
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

function razorpayWebhookSecret() {
  const secret = process.env["RAZORPAY_WEBHOOK_SECRET"];
  if (!secret) throw new Error("RAZORPAY_WEBHOOK_SECRET is not configured");
  return secret;
}

type RazorpayWebhookPayload = {
  event?: string;
  payload?: {
    payment?: { entity?: { id?: string; order_id?: string; status?: string; amount?: number; currency?: string } };
    order?: { entity?: { id?: string; status?: string } };
  };
};

export const razorpayWebhookService = {
  async handle(rawBody: string, signature: string | undefined, eventId: string | undefined) {
    if (!signature || !eventId) throw new Error("Razorpay webhook signature and event id are required");
    if (!verifyWebhookSignature(rawBody, signature, razorpayWebhookSecret())) throw new Error("Invalid Razorpay webhook signature");

    let payload: RazorpayWebhookPayload;
    try {
      payload = JSON.parse(rawBody) as RazorpayWebhookPayload;
    } catch {
      throw new Error("Invalid Razorpay webhook payload");
    }

    const eventType = payload.event ?? "unknown";
    const inserted = await db.transaction(async (tx) => {
      const existing = await tx.query.paymentWebhookEvents.findFirst({
        where: eq(paymentWebhookEvents.eventId, eventId),
      });
      if (existing) {
        if (existing.status === "PROCESSED") return "PROCESSED" as const;
        await tx.update(paymentWebhookEvents).set({
          eventType,
          payload: rawBody,
          status: "RECEIVED",
          nextAttemptAt: null,
          error: null,
        }).where(eq(paymentWebhookEvents.eventId, eventId));
        return "RETRY" as const;
      }
      await tx.insert(paymentWebhookEvents).values({
        eventId,
        eventType,
        payload: rawBody,
        status: "RECEIVED",
        nextAttemptAt: null,
      });
      return "INSERTED" as const;
    });

    if (inserted === "PROCESSED") return { duplicate: true, queued: false };

    // DB persistence is the durable source of truth. Redis only carries the
    // event id to a worker; if Redis is temporarily unavailable Razorpay gets
    // a non-2xx response and retries the webhook, while an already-persisted
    // RECEIVED event can also be re-queued by the worker/recovery loop.
    await redis.lpush(REDIS_QUEUES.RAZORPAY_WEBHOOKS, eventId);
    return { duplicate: inserted === "RETRY", queued: true };
  },

  async processEvent(eventId: string) {
    const event = await db.query.paymentWebhookEvents.findFirst({
      where: eq(paymentWebhookEvents.eventId, eventId),
    });
    if (!event) return { processed: false, reason: "not_found" as const };
    if (event.status === "PROCESSED") return { processed: true, duplicate: true };

    try {
      const payload = JSON.parse(event.payload) as RazorpayWebhookPayload;
      const eventType = payload.event ?? event.eventType;
      const paymentEntity = payload.payload?.payment?.entity;
      const orderEntity = payload.payload?.order?.entity;
      const gatewayOrderId = paymentEntity?.order_id ?? orderEntity?.id;
      const gatewayPaymentId = paymentEntity?.id;

      if ((eventType === "payment.captured" || eventType === "order.paid") && gatewayOrderId && gatewayPaymentId) {
        const payment = await db.query.payments.findFirst({
          where: and(eq(payments.method, "RAZORPAY"), eq(payments.gatewayOrderId, gatewayOrderId)),
          with: { order: true },
        });
        if (payment && payment.status !== "SUCCESS" && paymentEntity?.status === "captured" && paymentEntity.currency === "INR" && paymentEntity.amount === Math.round(Number(payment.amount) * 100)) {
          const releasedTicketIds = await db.transaction(async (tx) => {
            await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${payment.orderId}))`);
            const current = await tx.query.payments.findFirst({ where: eq(payments.id, payment.id) });
            if (!current || current.status === "SUCCESS") return [] as string[];
            const pending = await tx.query.kitchenTickets.findMany({
              where: and(eq(kitchenTickets.orderId, current.orderId), eq(kitchenTickets.status, "PENDING_PAYMENT")),
              columns: { id: true },
            });
            await tx.update(payments).set({
              status: "SUCCESS",
              reference: gatewayPaymentId,
              gatewayPaymentId,
              gatewayOrderId,
              updatedAt: new Date(),
            }).where(eq(payments.id, payment.id));
            if (pending.length) {
              await tx.update(kitchenTickets).set({ status: "FIRED", updatedAt: new Date() }).where(and(eq(kitchenTickets.orderId, current.orderId), eq(kitchenTickets.status, "PENDING_PAYMENT")));
            }
            return pending.map((ticket) => ticket.id);
          });

          if (releasedTicketIds.length) {
            const order = await orderRepository.findById(payment.order.tenantId, payment.orderId);
            if (order) {
              for (const ticketId of releasedTicketIds) {
                const ticketItems = order.items.filter((item: any) => item.kitchenTicketId === ticketId);
                const result = await inventoryService.deductForOrderItems(
                  payment.order.tenantId, payment.order.branchId, payment.orderId, ticketId,
                  ticketItems.map((item) => ({ menuItemId: item.menuItemId, quantity: item.quantity })), null,
                );
                if (result.short.length) console.error("Inventory was short when releasing paid takeaway order", payment.orderId, result.short);
              }
              const updated = await orderRepository.findById(payment.order.tenantId, payment.orderId);
              if (updated) {
                await eventBus.publish({ type: "order.updated", payload: updated as unknown as Order }, payment.order.tenantId, payment.order.branchId);
                for (const ticket of updated.kitchenTickets.filter((candidate: any) => releasedTicketIds.includes(candidate.id))) {
                  await eventBus.publish({ type: "kitchen.ticket.created", payload: ticket as any }, payment.order.tenantId, payment.order.branchId);
                }
              }
            }
          }
        }
      }

      if (eventType === "payment.failed" && gatewayOrderId && gatewayPaymentId) {
        await db.update(payments).set({ status: "FAILED", reference: gatewayPaymentId, gatewayPaymentId, gatewayOrderId, updatedAt: new Date() }).where(and(eq(payments.method, "RAZORPAY"), eq(payments.gatewayOrderId, gatewayOrderId), eq(payments.status, "PENDING")));
      }

      await db.update(paymentWebhookEvents).set({ status: "PROCESSED", processedAt: new Date(), nextAttemptAt: null, error: null }).where(eq(paymentWebhookEvents.eventId, eventId));
      return { processed: true, duplicate: false };
    } catch (error) {
      await db.update(paymentWebhookEvents).set({ status: "FAILED", attemptCount: sql`${paymentWebhookEvents.attemptCount} + 1`, nextAttemptAt: new Date(Date.now() + 30_000), error: error instanceof Error ? error.message : String(error) }).where(eq(paymentWebhookEvents.eventId, eventId));
      throw error;
    }
  },
};
