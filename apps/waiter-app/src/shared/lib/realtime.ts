import {
  createRealtimeClient,
  useRealtime as useRealtimeBase,
  useRealtimeEvent as useRealtimeEventBase,
  useRealtimeConnection,
} from "@pos/realtime";
import type { RealtimeEvent } from "@pos/types";
import { STORAGE_KEYS } from "@/shared/constants/storage-keys";
import { getToken } from "@/features/auth/storage";

const proto = window.location.protocol === "https:" ? "wss" : "ws";
const wsUrl =
  import.meta.env["VITE_WS_URL"] ??
  `${proto}://${window.location.host}/ws/events`;

const client = createRealtimeClient<RealtimeEvent>({
  url: wsUrl,
  getAccessToken: getToken,
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

export const useConnectionStatus = (): boolean => {
  return useRealtimeConnection(client);
};
