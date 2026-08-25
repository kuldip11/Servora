import { queryOptions } from "@tanstack/react-query";
import { analyticsService } from "./services/analytics.service";
import { analyticsKeys } from "./query-keys";

export function dashboardStatsQuery(refetchInterval: number | false = 30_000) {
  return queryOptions({
    queryKey: analyticsKeys.dashboard(),
    queryFn: analyticsService.dashboard,
    refetchInterval,
  });
}
