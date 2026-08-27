import { Elysia } from "elysia";
import { subscriber, REDIS_CHANNELS } from "../../lib/redis";
import { verifyAccessToken, type JwtPayload } from "../../lib/jwt";
import { db } from "../../db";
import {
  resolveAuthorization,
  resolveMembership,
} from "../../lib/authorization/authorization";
import { shouldDeliverRealtimeEvent } from "./delivery-scope";
import { customerService } from "../customer/customer.service";


const customerClients = new Map<string, Set<any>>();

function addCustomerClient(sessionId: string, ws: any) {
  if (!customerClients.has(sessionId)) customerClients.set(sessionId, new Set());
  customerClients.get(sessionId)!.add(ws);
}
function removeCustomerClient(sessionId: string, ws: any) {
  const set = customerClients.get(sessionId);
  if (!set) return;
  set.delete(ws);
  if (set.size === 0) customerClients.delete(sessionId);
}

function customerSessionIdFromEvent(event: any): string | undefined {
  if (event.type === "customer.request.created" || event.type === "customer.request.updated") return event.payload?.customerSessionId;
  if (event.type === "order.created" || event.type === "order.updated") return event.payload?.customerSessionId ?? event.payload?.customerSession?.id;
  return undefined;
}

// Connected clients are grouped by tenant. Each socket also carries its
// authorized branch scope so tenant-wide events never leak into a branch-only
// session. A null branch means tenant-wide access.
const clients = new Map<string, Set<any>>();

function addClient(tenantId: string, ws: any) {
  if (!clients.has(tenantId)) {
    clients.set(tenantId, new Set());
  }
  clients.get(tenantId)!.add(ws);
}

function removeClient(tenantId: string, ws: any) {
  const tenantClients = clients.get(tenantId);
  if (!tenantClients) return;
  tenantClients.delete(ws);
  if (tenantClients.size === 0) clients.delete(tenantId);
}

/**
 * Resolve a WebSocket session through the same active-membership boundary as HTTP.
 * A signed JWT alone is not sufficient: tenantId/membershipId claims are treated
 * as selectors, and the database decides whether the membership is still active.
 */
export async function resolveRealtimeContext(
  payload: JwtPayload,
  tenantId: string,
  branchId?: string,
) {
  if (!tenantId) throw new Error("ACTIVE_FRANCHISE_REQUIRED");

  const membership = await resolveMembership(db, payload.sub, tenantId);
  if (!membership) throw new Error("ACTIVE_FRANCHISE_REQUIRED");

  const decision = await resolveAuthorization(db, {
    userId: payload.sub,
    tenantId: membership.tenantId,
    branchId: branchId && branchId !== "all" ? branchId : null,
  });
  if (
    !decision.allowed ||
    !decision.permissionKeys.some((key) =>
      ["orders:read", "kitchen:read", "inventory:read", "tables:read"].includes(
        key,
      ),
    )
  ) {
    throw new Error("REALTIME_PERMISSION_REQUIRED");
  }

  if (
    branchId &&
    branchId !== "all" &&
    !decision.branchIds.includes(branchId) &&
    !decision.tenantWide
  ) {
    throw new Error("REALTIME_BRANCH_ACCESS_REQUIRED");
  }

  return {
    tenantId: membership.tenantId,
    membershipId: membership.id,
    branchId: branchId && branchId !== "all" ? branchId : null,
  };
}

// Subscribe to Redis channels and forward to WebSocket clients
async function startRedisSubscription() {
  await subscriber.subscribe(
    REDIS_CHANNELS.ORDER_EVENTS,
    REDIS_CHANNELS.KITCHEN_EVENTS,
    REDIS_CHANNELS.INVENTORY_EVENTS,
    REDIS_CHANNELS.TABLE_EVENTS,
  );

  subscriber.on("message", (channel, message) => {
    try {
      const event = JSON.parse(message) as {
        tenantId: string;
        branchId?: string | null;
      };
      const sessionId = customerSessionIdFromEvent(event);
      if (sessionId) {
        const sessionClients = customerClients.get(sessionId);
        if (sessionClients) {
          for (const ws of sessionClients) {
            try { ws.send(message); } catch { removeCustomerClient(sessionId, ws); }
          }
        }
      }
      const tenantClients = clients.get(event.tenantId);
      if (!tenantClients) return;
      for (const ws of tenantClients) {
        try {
          if (
            shouldDeliverRealtimeEvent((ws as any).__branchId, event.branchId)
          ) {
            ws.send(message);
          }
        } catch {
          removeClient(event.tenantId, ws);
        }
      }
    } catch (err) {
      console.error("[WS Gateway] Failed to parse Redis message:", err);
    }
  });
}

startRedisSubscription().catch(console.error);

export const realtimeRouter = new Elysia({ prefix: "/ws" }).ws("/events", {
  async open(ws) {
    // Auth happens via query param token for WebSocket
    const token = ws.data.query["token"] as string;
    if (!token) {
      ws.send(JSON.stringify({ type: "error", code: "AUTH_MISSING_TOKEN" }));
      ws.close();
      return;
    }

    try {
      const payload = verifyAccessToken(token);
      const tenantId = String(ws.data.query["tenantId"] ?? "");
      const branchId = ws.data.query["branchId"]
        ? String(ws.data.query["branchId"])
        : undefined;
      const context = await resolveRealtimeContext(payload, tenantId, branchId);
      (ws as any).__tenantId = context.tenantId;
      (ws as any).__branchId = context.branchId;
      addClient(context.tenantId, ws);
      ws.send(
        JSON.stringify({ type: "connected", tenantId: context.tenantId }),
      );
    } catch {
      ws.send(JSON.stringify({ type: "error", code: "AUTH_INVALID_TOKEN" }));
      ws.close();
    }
  },

  message(ws, message) {
    // Handle ping/pong keepalive
    if (message === "ping") ws.send("pong");
  },

  close(ws) {
    const tenantId = (ws as any).__tenantId as string | undefined;
    if (tenantId) removeClient(tenantId, ws);
  },
});


export const customerRealtimeRouter = new Elysia({ prefix: "/ws/customer" }).ws("/events", {
  async open(ws) {
    const token = String(ws.data.query["session"] ?? "");
    if (!token) { ws.send(JSON.stringify({ type: "error", code: "CUSTOMER_SESSION_REQUIRED" })); ws.close(); return; }
    try {
      const session = await customerService.getSession(token);
      (ws as any).__customerSessionId = session.id;
      addCustomerClient(session.id, ws);
      ws.send(JSON.stringify({ type: "connected", sessionId: session.id }));
    } catch {
      ws.send(JSON.stringify({ type: "error", code: "CUSTOMER_SESSION_INVALID" }));
      ws.close();
    }
  },
  message(ws, message) { if (message === "ping") ws.send("pong"); },
  close(ws) { const id = (ws as any).__customerSessionId as string | undefined; if (id) removeCustomerClient(id, ws); },
});
