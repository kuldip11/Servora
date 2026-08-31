import { Elysia } from "elysia";
import { ForbiddenError } from "@/core/errors";
import { subscriber, REDIS_CHANNELS } from "@/lib/redis";
import { verifyAccessToken, type JwtPayload } from "@/lib/jwt";
import { db } from "@/db";
import {
  resolveAuthorization,
  resolveMembership,
} from "@/core/auth/authorization";
import { shouldDeliverRealtimeEvent } from "./delivery-scope";
import { customerService } from "@/modules/customer/customer.service";
import { metrics } from "@/core/observability/metrics";

interface RealtimeSocket {
  send(message: string): unknown;
  close(): unknown;
}

type RealtimeEnvelope = {
  type?: string;
  tenantId?: string;
  branchId?: string | null;
  payload?: {
    customerSessionId?: string;
    customerSession?: { id?: string };
  };
};

const customerClients = new Map<string, Set<RealtimeSocket>>();
interface CustomerBranchSocket {
  send(message: string): unknown;
}
const customerBranchClients = new Map<string, Set<CustomerBranchSocket>>();
const customerScopeBySocket = new WeakMap<
  object,
  { tenantId: string; branchId: string }
>();
const customerSessionBySocket = new WeakMap<object, string>();

const customerBranchKey = (tenantId: string, branchId: string) => {
  return `${tenantId}:${branchId}`;
};
const addCustomerBranchClient = (
  tenantId: string,
  branchId: string,
  ws: CustomerBranchSocket,
) => {
  const key = customerBranchKey(tenantId, branchId);
  if (!customerBranchClients.has(key))
    customerBranchClients.set(key, new Set());
  customerBranchClients.get(key)!.add(ws);
};
const removeCustomerBranchClient = (
  tenantId: string,
  branchId: string,
  ws: CustomerBranchSocket,
) => {
  const key = customerBranchKey(tenantId, branchId);
  const set = customerBranchClients.get(key);
  if (!set) return;
  set.delete(ws);
  if (set.size === 0) customerBranchClients.delete(key);
};

const addCustomerClient = (sessionId: string, ws: RealtimeSocket) => {
  if (!customerClients.has(sessionId))
    customerClients.set(sessionId, new Set());
  customerClients.get(sessionId)!.add(ws);
};
const removeCustomerClient = (sessionId: string, ws: RealtimeSocket) => {
  const set = customerClients.get(sessionId);
  if (!set) return;
  set.delete(ws);
  if (set.size === 0) customerClients.delete(sessionId);
};

const customerSessionIdFromEvent = (
  event: RealtimeEnvelope,
): string | undefined => {
  if (
    event.type === "customer.request.created" ||
    event.type === "customer.request.updated"
  )
    return event.payload?.customerSessionId;
  if (event.type === "order.created" || event.type === "order.updated")
    return (
      event.payload?.customerSessionId ?? event.payload?.customerSession?.id
    );
  return undefined;
};

const clients = new Map<string, Set<RealtimeSocket>>();
const staffScopeBySocket = new WeakMap<
  object,
  { tenantId: string; branchId: string | null }
>();
let staffConnectionCount = 0;
let customerConnectionCount = 0;

const addClient = (tenantId: string, ws: RealtimeSocket) => {
  if (!clients.has(tenantId)) {
    clients.set(tenantId, new Set());
  }
  clients.get(tenantId)!.add(ws);
};

const removeClient = (tenantId: string, ws: RealtimeSocket) => {
  const tenantClients = clients.get(tenantId);
  if (!tenantClients) return;
  tenantClients.delete(ws);
  if (tenantClients.size === 0) clients.delete(tenantId);
};

export const resolveRealtimeContext = async (
  payload: JwtPayload,
  tenantId: string,
  branchId?: string,
) => {
  if (!tenantId) throw new ForbiddenError("Active franchise is required");

  const membership = await resolveMembership(db, payload.sub, tenantId);
  if (!membership) throw new ForbiddenError("Active franchise is required");

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
    throw new ForbiddenError("Realtime permission is required");
  }

  if (
    branchId &&
    branchId !== "all" &&
    !decision.branchIds.includes(branchId) &&
    !decision.tenantWide
  ) {
    throw new ForbiddenError("Realtime branch access denied");
  }

  return {
    tenantId: membership.tenantId,
    membershipId: membership.id,
    branchId: branchId && branchId !== "all" ? branchId : null,
  };
};

export const forwardTenantRealtimeMessage = (
  message: string,
  tenantClients: Map<
    string,
    Set<{ __branchId?: string | null; send(message: string): void }>
  > = clients,
): void => {
  const event = JSON.parse(message) as {
    tenantId: string;
    branchId?: string | null;
  };
  const scopedClients = tenantClients.get(event.tenantId);
  if (!scopedClients) return;
  for (const ws of scopedClients) {
    if (!shouldDeliverRealtimeEvent(ws.__branchId, event.branchId)) continue;
    try {
      ws.send(message);
    } catch {
      if (tenantClients === clients)
        removeClient(event.tenantId, ws as RealtimeSocket);
    }
  }
};

const startRedisSubscription = async () => {
  await subscriber.subscribe(
    REDIS_CHANNELS.ORDER_EVENTS,
    REDIS_CHANNELS.KITCHEN_EVENTS,
    REDIS_CHANNELS.INVENTORY_EVENTS,
    REDIS_CHANNELS.TABLE_EVENTS,
  );

  subscriber.on("message", (channel, message) => {
    try {
      const event = JSON.parse(message) as RealtimeEnvelope;
      const sessionId = customerSessionIdFromEvent(event);
      if (sessionId) {
        const sessionClients = customerClients.get(sessionId);
        if (sessionClients) {
          for (const ws of sessionClients) {
            try {
              ws.send(message);
            } catch {
              removeCustomerClient(sessionId, ws);
            }
          }
        }
      }
      if (
        event.tenantId &&
        event.branchId &&
        event.type === "menu.availability.updated"
      ) {
        const branchClients = customerBranchClients.get(
          customerBranchKey(event.tenantId, event.branchId),
        );
        if (branchClients) {
          for (const ws of branchClients) {
            try {
              ws.send(message);
            } catch {
              removeCustomerBranchClient(event.tenantId, event.branchId, ws);
            }
          }
        }
      }

      if (event.tenantId) forwardTenantRealtimeMessage(message);
    } catch (err) {
      console.error("[WS Gateway] Failed to parse Redis message:", err);
    }
  });
};

startRedisSubscription().catch(console.error);

export const realtimeRouter = new Elysia({ prefix: "/ws" }).ws("/events", {
  async open(ws) {
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
      staffScopeBySocket.set(ws, {
        tenantId: context.tenantId,
        branchId: context.branchId,
      });
      addClient(context.tenantId, ws);
      staffConnectionCount += 1;
      metrics.setGauge("servora_websocket_connections", staffConnectionCount, {
        kind: "staff",
      });
      ws.send(
        JSON.stringify({ type: "connected", tenantId: context.tenantId }),
      );
    } catch {
      ws.send(JSON.stringify({ type: "error", code: "AUTH_INVALID_TOKEN" }));
      ws.close();
    }
  },

  message(ws, message) {
    if (message === "ping") ws.send("pong");
  },

  close(ws) {
    const scope = staffScopeBySocket.get(ws);
    if (scope) {
      removeClient(scope.tenantId, ws);
      staffConnectionCount = Math.max(0, staffConnectionCount - 1);
      metrics.setGauge("servora_websocket_connections", staffConnectionCount, {
        kind: "staff",
      });
    }
    staffScopeBySocket.delete(ws);
  },
});

export const customerRealtimeRouter = new Elysia({ prefix: "/ws/customer" }).ws(
  "/events",
  {
    async open(ws) {
      const token = String(ws.data.query["session"] ?? "");
      if (!token) {
        ws.send(
          JSON.stringify({ type: "error", code: "CUSTOMER_SESSION_REQUIRED" }),
        );
        ws.close();
        return;
      }
      try {
        const session = await customerService.getSession(token);
        customerSessionBySocket.set(ws, session.id);
        customerScopeBySocket.set(ws, {
          tenantId: session.tenantId,
          branchId: session.branchId,
        });
        addCustomerClient(session.id, ws);
        addCustomerBranchClient(session.tenantId, session.branchId, ws);
        customerConnectionCount += 1;
        metrics.setGauge(
          "servora_websocket_connections",
          customerConnectionCount,
          { kind: "customer" },
        );
        ws.send(JSON.stringify({ type: "connected", sessionId: session.id }));
      } catch {
        ws.send(
          JSON.stringify({ type: "error", code: "CUSTOMER_SESSION_INVALID" }),
        );
        ws.close();
      }
    },
    message(ws, message) {
      if (message === "ping") ws.send("pong");
    },
    close(ws) {
      const id = customerSessionBySocket.get(ws);
      const scope = customerScopeBySocket.get(ws);
      if (id) {
        removeCustomerClient(id, ws);
        customerConnectionCount = Math.max(0, customerConnectionCount - 1);
        metrics.setGauge(
          "servora_websocket_connections",
          customerConnectionCount,
          { kind: "customer" },
        );
      }
      if (scope) removeCustomerBranchClient(scope.tenantId, scope.branchId, ws);
      customerSessionBySocket.delete(ws);
      customerScopeBySocket.delete(ws);
    },
  },
);
