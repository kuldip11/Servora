import {
  createRealtimeClient,
  useRealtime as useRealtimeBase,
  useRealtimeEvent as useRealtimeEventBase,
  useRealtimeConnection,
} from '@pos/realtime';
import type { RealtimeEvent } from '@pos/types';
import { STORAGE_KEYS } from '../constants/storage-keys';

// Matches the protocol-detection this app's original inline WebSocket used
// (wss over https, ws otherwise) — kept here since it was already correct
// and apps/web's hardcoded 'ws://' isn't something to copy.
const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
const wsUrl = import.meta.env['VITE_WS_URL'] ?? `${proto}://${window.location.host}/ws/events`;

const client = createRealtimeClient<RealtimeEvent>({
  url: wsUrl,
  getAccessToken: () => sessionStorage.getItem(STORAGE_KEYS.token),
  getTenantId: () => sessionStorage.getItem(STORAGE_KEYS.tenant),
  getBranchId: () => sessionStorage.getItem(STORAGE_KEYS.branch),
});

export function useRealtime(handler: (event: RealtimeEvent) => void) {
  useRealtimeBase(client, handler);
}

export function useRealtimeEvent<T extends RealtimeEvent['type']>(
  type: T,
  handler: (event: Extract<RealtimeEvent, { type: T }>) => void,
) {
  useRealtimeEventBase(client, type, handler);
}

/** "Live"/"Polling" connection indicator — backed by @pos/realtime's
 *  auto-reconnect. See FE-4 in docs/frontend/NEXT_STEPS.md. */
export function useConnectionStatus(): boolean {
  return useRealtimeConnection(client);
}
