import Redis from "ioredis";
import { metrics } from "../core/observability/metrics";

const redisUrl = process.env["REDIS_URL"];
if (!redisUrl) {
  throw new Error("REDIS_URL environment variable is required");
}

const redisOptions = {
  lazyConnect: process.env["NODE_ENV"] === "test",
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  retryStrategy: (times: number) => Math.min(times * 100, 3000),
};

export const redis = new Redis(redisUrl, redisOptions);

export const publisher = new Redis(redisUrl, redisOptions);

export const subscriber = new Redis(redisUrl, redisOptions);

redis.on("error", (err) => {
  metrics.setGauge("servora_redis_available", 0);
  console.error("[Redis] Error:", err);
});
publisher.on("error", (err) => console.error("[Redis Publisher] Error:", err));
subscriber.on("error", (err) =>
  console.error("[Redis Subscriber] Error:", err),
);

redis.on("connect", () => {
  metrics.setGauge("servora_redis_available", 1);
  console.log("[Redis] Connected");
});
redis.on("close", () => metrics.setGauge("servora_redis_available", 0));

export async function closeRedisConnections(): Promise<void> {
  await Promise.allSettled([redis.quit(), publisher.quit(), subscriber.quit()]);
}

export const CACHE_TTL = {
  SHORT: 60,
  MEDIUM: 300,
  LONG: 3600,
  DAY: 86400,
} as const;

export const REDIS_CHANNELS = {
  ORDER_EVENTS: "pos:order_events",
  KITCHEN_EVENTS: "pos:kitchen_events",
  INVENTORY_EVENTS: "pos:inventory_events",
  TABLE_EVENTS: "pos:table_events",
} as const;

export const REDIS_QUEUES = {
  RAZORPAY_WEBHOOKS: "pos:queue:razorpay_webhooks",
} as const;
