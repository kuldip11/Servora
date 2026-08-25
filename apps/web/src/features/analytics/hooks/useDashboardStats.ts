import { useQuery } from '@tanstack/react-query';
import { dashboardStatsQuery } from '../query-options';
import { useRealtimeConnection } from '../../../shared/lib/realtime';

export function useDashboardStats() {
  const realtimeConnected = useRealtimeConnection();

  // Realtime is authoritative while connected. Polling becomes the fallback
  // when the socket is unavailable, avoiding duplicate requests during normal
  // live operation while still recovering automatically after a disconnect.
  return useQuery(dashboardStatsQuery(realtimeConnected ? false : 30_000));
}
