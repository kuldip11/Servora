import Redis from "ioredis";

const redisUrl = process.env["REDIS_URL"];
if (!redisUrl) {
  throw new Error("REDIS_URL environment variable is required");
}

const redisOptions = {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  retryStrategy: (times: number) => Math.min(times * 100, 3000),
};

// Main client for cache operations
export const redis = new Redis(redisUrl, redisOptions);

// Dedicated publisher (must NOT share connection with subscriber)
export const publisher = new Redis(redisUrl, redisOptions);

// Dedicated subscriber (blocks connection for pub/sub only)
export const subscriber = new Redis(redisUrl, redisOptions);

redis.on("error", (err) => console.error("[Redis] Error:", err));
publisher.on("error", (err) => console.error("[Redis Publisher] Error:", err));
subscriber.on("error", (err) =>
  console.error("[Redis Subscriber] Error:", err),
);

redis.on("connect", () => console.log("[Redis] Connected"));

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
