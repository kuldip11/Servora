import { useQuery } from "@tanstack/react-query";
import { dashboardStatsQuery } from "../query-options";
import { useRealtimeConnection } from "../../../shared/lib/realtime";

export function useDashboardStats() {
  const realtimeConnected = useRealtimeConnection();

  return useQuery(dashboardStatsQuery(realtimeConnected ? false : 30_000));
}
