import type { RealtimeClientConfig } from "./types";

export interface RealtimeClient<E extends { type: string }> {

  subscribe(handler: (event: E) => void): () => void;
  isConnected(): boolean;

  onConnectionChange(listener: (connected: boolean) => void): () => void;
  reconnect(): void;
}

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

      }
    };

    ws.onclose = () => {
      ws = null;
      setConnected(false);

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
