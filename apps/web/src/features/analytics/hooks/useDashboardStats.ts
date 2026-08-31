import { useQuery } from "@tanstack/react-query";
import { dashboardStatsQuery } from "@/features/analytics/query-options";
import { useRealtimeConnection } from "@/shared/lib/realtime";

export const useDashboardStats = () => {
  const realtimeConnected = useRealtimeConnection();

  return useQuery(dashboardStatsQuery(realtimeConnected ? false : 30_000));
};
