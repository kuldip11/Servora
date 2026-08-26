import { useEffect } from "react";
import {
  createRealtimeClient,
  useRealtime as useRealtimeBase,
  useRealtimeEvent as useRealtimeEventBase,
  useRealtimeConnection as useRealtimeConnectionBase,
} from "@pos/realtime";
import { useAuthStore } from "../../store/auth";
import type { RealtimeEvent } from "@pos/types";

const wsUrl =
  import.meta.env["VITE_WS_URL"] ?? `ws://${window.location.host}/ws/events`;

const client = createRealtimeClient<RealtimeEvent>({
  url: wsUrl,
  getAccessToken: () => useAuthStore.getState().accessToken,
  getTenantId: () => useAuthStore.getState().franchiseId,
  getBranchId: () => useAuthStore.getState().branchId,
});

function useRealtimeContextSync() {
  const franchiseId = useAuthStore((state) => state.franchiseId);
  const branchId = useAuthStore((state) => state.branchId);

  useEffect(() => {
    if (useAuthStore.getState().accessToken) client.reconnect();
  }, [franchiseId, branchId]);
}

export function useRealtime(handler: (event: RealtimeEvent) => void) {
  useRealtimeContextSync();
  useRealtimeBase(client, handler);
}

export function useRealtimeEvent<T extends RealtimeEvent["type"]>(
  type: T,
  handler: (event: Extract<RealtimeEvent, { type: T }>) => void,
) {
  useRealtimeContextSync();
  useRealtimeEventBase(client, type, handler);
}

export function useRealtimeConnection() {
  useRealtimeContextSync();
  return useRealtimeConnectionBase(client);
}
