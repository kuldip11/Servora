import { Elysia } from "elysia";
import { redis } from "../../lib/redis";
import { env } from "../../config/env";
import { resolveClientIp } from "./client-ip";

const RATE_LIMIT_PREFIX = "servora:rate-limit";

function requestIp(
  headers: Record<string, string | undefined>,
  directIp: string | undefined,
): string {
  return resolveClientIp(headers, directIp, env.TRUST_PROXY_HOPS) ?? "unknown";
}

function isRateLimitExempt(pathname: string): boolean {
  return (
    pathname.startsWith("/health") ||
    pathname.startsWith("/swagger") ||
    pathname.startsWith("/ws")
  );
}

export const securityHeadersPlugin = () =>
  new Elysia({ name: "security-headers" }).onAfterHandle(
    { as: "global" },
    ({ set }) => {
      set.headers["x-content-type-options"] = "nosniff";
      set.headers["x-frame-options"] = "DENY";
      set.headers["referrer-policy"] = "no-referrer";
      set.headers["permissions-policy"] =
        "camera=(), microphone=(), geolocation=(), payment=()";
      set.headers["cross-origin-opener-policy"] = "same-origin";
      set.headers["cross-origin-resource-policy"] = "same-site";
      set.headers["content-security-policy"] =
        "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'";
      if (env.NODE_ENV === "production") {
        set.headers["strict-transport-security"] =
          "max-age=31536000; includeSubDomains";
      }
    },
  );

export const rateLimitPlugin = () =>
  new Elysia({ name: "global-rate-limit" }).onBeforeHandle(
    { as: "global" },
    async ({ request, headers, set, server }) => {
      const pathname = new URL(request.url).pathname;
      if (isRateLimitExempt(pathname)) return;

      const ip = requestIp(headers as Record<string, string | undefined>);
      const bucket = Math.floor(
        Date.now() / (env.RATE_LIMIT_WINDOW_SECONDS * 1000),
      );
      const key = `${RATE_LIMIT_PREFIX}:${ip}:${bucket}`;

      try {
        const count = await redis.incr(key);
        if (count === 1)
          await redis.expire(key, env.RATE_LIMIT_WINDOW_SECONDS + 1);

        set.headers["x-ratelimit-limit"] = String(env.RATE_LIMIT_MAX);
        set.headers["x-ratelimit-remaining"] = String(
          Math.max(0, env.RATE_LIMIT_MAX - count),
        );

        if (count > env.RATE_LIMIT_MAX) {
          set.status = 429;
          set.headers["retry-after"] = String(env.RATE_LIMIT_WINDOW_SECONDS);
          return {
            success: false,
            code: "RATE_LIMITED",
            message: "Too many requests",
          };
        }
      } catch {
        // Availability wins over rate-limit enforcement if Redis is temporarily
        // unavailable. /health/ready will still report the dependency failure.
      }

      return undefined;
    },
  );
