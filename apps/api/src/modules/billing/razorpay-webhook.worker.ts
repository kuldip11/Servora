import Redis from "ioredis";
import { and, inArray, lte, or, isNull } from "drizzle-orm";
import { db } from "../../db";
import { paymentWebhookEvents } from "../../db/schema";
import { razorpayWebhookService } from "./razorpay-webhook.service";
import { metrics } from "../../core/observability/metrics";

import { RAZORPAY_WEBHOOK_QUEUE } from "./constants";
const queueUrl = process.env["REDIS_URL"];

async function recoverDurableEvents() {
  const now = new Date();
  const events = await db.query.paymentWebhookEvents.findMany({
    where: and(
      inArray(paymentWebhookEvents.status, ["RECEIVED", "FAILED"]),
      or(
        isNull(paymentWebhookEvents.nextAttemptAt),
        lte(paymentWebhookEvents.nextAttemptAt, now),
      ),
    ),
    columns: { eventId: true },
    limit: 100,
  });
  if (!events.length) return;
  const redis = new Redis(queueUrl!, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
  });
  try {
    for (const event of events) await redis.lpush(RAZORPAY_WEBHOOK_QUEUE, event.eventId);
    await db
      .update(paymentWebhookEvents)
      .set({ nextAttemptAt: new Date(Date.now() + 30_000) })
      .where(
        inArray(
          paymentWebhookEvents.eventId,
          events.map((event) => event.eventId),
        ),
      );
  } finally {
    await redis.quit();
  }
}

export function startRazorpayWebhookWorker() {
  if (!queueUrl) {
    throw new Error("REDIS_URL environment variable is required");
  }

  const workerRedis = new Redis(queueUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  });
  let stopped = false;
  let recoveryTimer: ReturnType<typeof setInterval> | undefined;

  const run = async () => {
    while (!stopped) {
      try {
        const result = await workerRedis.brpop(RAZORPAY_WEBHOOK_QUEUE, 5);
        if (!result) continue;
        const eventId = result[1];
        try {
          await razorpayWebhookService.processEvent(eventId);
        } catch (error) {
          metrics.increment("servora_payment_webhook_failures_total", { stage: "worker" });
          console.error(`[Razorpay Worker] Failed event ${eventId}`, error);
        }
      } catch (error) {
        if (!stopped) {
          metrics.increment("servora_payment_webhook_failures_total", { stage: "queue" });
          console.error("[Razorpay Worker] Redis error", error);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }
  };

  recoveryTimer = setInterval(() => {
    void recoverDurableEvents().catch((error) =>
      console.error("[Razorpay Worker] Recovery scan failed", error),
    );
  }, 30_000);
  void recoverDurableEvents().catch((error) =>
    console.error("[Razorpay Worker] Initial recovery scan failed", error),
  );
  void run();

  return () => {
    stopped = true;
    if (recoveryTimer) clearInterval(recoveryTimer);
    void workerRedis.quit();
  };
}
