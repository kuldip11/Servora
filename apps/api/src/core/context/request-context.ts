/**
 * Request context plugin.
 *
 * Adds a `requestId` (and start time, for a response-time header) to every
 * request. Purely additive: it derives a new `context` property and sets
 * two response headers (`x-request-id`, `x-response-time`) — it does not
 * change any existing route's status code or response body.
 */
import { Elysia } from "elysia";
import { randomUUID } from "crypto";
import { env } from "../../config/env";
import { resolveClientIp } from "../security/client-ip";

export interface RequestContext {
  requestId: string;
  startTime: number;
  userAgent?: string;
  ip?: string;
}

export const requestContextPlugin = () =>
  new Elysia({ name: "request-context" })
    .derive({ as: "global" }, ({ headers, request, server }) => {
      const directIp = server?.requestIP(request)?.address;
      return {
        requestContext: {
          requestId: randomUUID(),
          startTime: Date.now(),
          userAgent: headers["user-agent"],
          ip: resolveClientIp(headers, directIp, env.TRUST_PROXY_HOPS),
        } as RequestContext,
      };
    })
    .onAfterHandle({ as: "global" }, ({ set, requestContext }) => {
      const duration = Date.now() - requestContext.startTime;
      set.headers["x-request-id"] = requestContext.requestId;
      set.headers["x-response-time"] = `${duration}ms`;
    });
