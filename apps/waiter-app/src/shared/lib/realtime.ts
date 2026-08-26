import {
  createRealtimeClient,
  useRealtime as useRealtimeBase,
  useRealtimeEvent as useRealtimeEventBase,
  useRealtimeConnection,
} from "@pos/realtime";
import type { RealtimeEvent } from "@pos/types";
import { STORAGE_KEYS } from "../constants/storage-keys";

// This app has never had a WebSocket before — see FE-4 in
// docs/frontend/NEXT_STEPS.md for why this is a deliberate, accepted
// behavior change rather than a like-for-like extraction. Protocol
// detection mirrors kitchen-display's (correct) original inline version.
const proto = window.location.protocol === "https:" ? "wss" : "ws";
const wsUrl =
  import.meta.env["VITE_WS_URL"] ??
  `${proto}://${window.location.host}/ws/events`;

const client = createRealtimeClient<RealtimeEvent>({
  url: wsUrl,
  getAccessToken: () => localStorage.getItem(STORAGE_KEYS.token),
  getTenantId: () => localStorage.getItem(STORAGE_KEYS.tenant),
  getBranchId: () => localStorage.getItem(STORAGE_KEYS.branch),
});

export function useRealtime(handler: (event: RealtimeEvent) => void) {
  useRealtimeBase(client, handler);
}

export function useRealtimeEvent<T extends RealtimeEvent["type"]>(
  type: T,
  handler: (event: Extract<RealtimeEvent, { type: T }>) => void,
) {
  useRealtimeEventBase(client, type, handler);
}

export function useConnectionStatus(): boolean {
  return useRealtimeConnection(client);
}
