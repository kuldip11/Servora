export interface RealtimeClientConfig {
  /** Full WebSocket URL (ws:// or wss://), including path — no query string. */
  url: string;
  getAccessToken: () => string | null;
  /** Active franchise/tenant request context. */
  getTenantId?: () => string | null;
  /** Active branch request context. `null` means tenant-wide. */
  getBranchId?: () => string | null;
  reconnectDelayMs?: number;
}
