import { redis } from "../../lib/redis";

const WINDOW_SECONDS = 60;
const SESSION_LIMIT = 5;
const IP_LIMIT = 30;

export async function enforceCustomerRateLimit(
  request: Request,
  scope: "session" | "ip",
  identifier: string,
) {
  const limit = scope === "session" ? SESSION_LIMIT : IP_LIMIT;
  const key = `ratelimit:customer:${scope}:${identifier}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, WINDOW_SECONDS);
  if (count > limit) {
    const retryAfter = await redis.ttl(key);
    return { allowed: false, retryAfter: Math.max(retryAfter, 1) };
  }
  return { allowed: true, retryAfter: 0 };
}

export function customerClientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? "unknown";
}
