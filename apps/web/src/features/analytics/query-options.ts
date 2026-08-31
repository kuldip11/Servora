import { queryOptions } from "@tanstack/react-query";
import { analyticsService } from "./services/analytics.service";
import { analyticsKeys } from "./query-keys";

export const dashboardStatsQuery = (
  refetchInterval: number | false = 30_000,
) => {
  return queryOptions({
    queryKey: analyticsKeys.dashboard(),
    queryFn: analyticsService.dashboard,
    refetchInterval,
  });
};

export const costMarginQuery = (categoryId?: string, enabled = true) => {
  return queryOptions({
    queryKey: analyticsKeys.costMargin(categoryId),
    queryFn: () => analyticsService.costMargin(categoryId),
    enabled,
  });
};
