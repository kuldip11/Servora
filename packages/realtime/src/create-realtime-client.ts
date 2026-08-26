import type { RealtimeClientConfig } from "./types";

export interface RealtimeClient<E extends { type: string }> {
  /** Subscribe to every event. Connects lazily on first subscriber, disconnects when the last one leaves. Returns an unsubscribe function. */
  subscribe(handler: (event: E) => void): () => void;
  isConnected(): boolean;
  /** Fired whenever the underlying socket opens or closes. */
  onConnectionChange(listener: (connected: boolean) => void): () => void;
  reconnect(): void;
}

/**
 * Creates a realtime (WebSocket) client: a single connection shared by every
 * subscriber, auto-reconnecting after `reconnectDelayMs` (default 3s) any
 * time the socket closes, re-reading `getAccessToken()` at reconnect time
 * rather than reusing the token captured at the original connect call (so a
 * token refreshed while disconnected is picked up, and a logged-out app
 * naturally stops retrying once `getAccessToken()` starts returning null).
 *
 * State (the socket, the handler set, the reconnect timer) lives in this
 * factory's closure rather than module-level globals, so each call produces
 * an independent client — each app creates exactly one, but this also means
 * a test can create as many isolated instances as it needs.
 *
 * This is the shared foundation apps/web's `lib/realtime.ts` originally
 * implemented as a module singleton; apps/kitchen-display and
 * apps/waiter-app both now build on it too (see docs/frontend/NEXT_STEPS.md's
 * FE-4 entry for what changes that brings for each of those two apps).
 */
export function createRealtimeClient<E extends { type: string }>(
  config: RealtimeClientConfig,
): RealtimeClient<E> {
  const {
    url,
    getAccessToken,
    getTenantId,
    getBranchId,
    reconnectDelayMs = 3000,
  } = config;

  let ws: WebSocket | null = null;
  const handlers = new Set<(event: E) => void>();
  const connectionListeners = new Set<(connected: boolean) => void>();
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let connected = false;

  function setConnected(value: boolean) {
    if (connected === value) return;
    connected = value;
    connectionListeners.forEach((l) => l(value));
  }

  function connect(token: string) {
    if (
      ws &&
      (ws.readyState === WebSocket.OPEN ||
        ws.readyState === WebSocket.CONNECTING)
    )
      return;

    const params = new URLSearchParams({ token });
    const tenantId = getTenantId?.();
    const branchId = getBranchId?.();
    if (tenantId) params.set("tenantId", tenantId);
    if (branchId) params.set("branchId", branchId);
    ws = new WebSocket(`${url}?${params.toString()}`);

    ws.onopen = () => setConnected(true);

    ws.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data) as E;
        handlers.forEach((h) => h(event));
      } catch {
        // Malformed payload — ignore, matches original apps/web behavior.
      }
    };

    ws.onclose = () => {
      ws = null;
      setConnected(false);
      // An intentional unsubscribe/logout must not create a new reconnect
      // timer. Only an active subscriber keeps the connection alive.
      if (handlers.size === 0) return;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        const currentToken = getAccessToken();
        if (currentToken && handlers.size > 0) connect(currentToken);
      }, reconnectDelayMs);
    };

    ws.onerror = () => ws?.close();
  }

  function disconnect() {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = null;
    ws?.close();
    ws = null;
    setConnected(false);
  }

  function subscribe(handler: (event: E) => void) {
    handlers.add(handler);

    const token = getAccessToken();
    if (token) connect(token);

    return () => {
      handlers.delete(handler);
      if (handlers.size === 0) disconnect();
    };
  }

  function reconnect() {
    if (ws) ws.close();
    else {
      const token = getAccessToken();
      if (token) connect(token);
    }
  }

  function onConnectionChange(listener: (connected: boolean) => void) {
    connectionListeners.add(listener);
    return () => connectionListeners.delete(listener);
  }

  return {
    subscribe,
    isConnected: () => connected,
    onConnectionChange,
    reconnect,
  };
}
