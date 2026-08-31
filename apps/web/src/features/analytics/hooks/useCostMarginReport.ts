import { useQuery } from "@tanstack/react-query";
import { costMarginQuery } from "@/features/analytics/query-options";

export const useCostMarginReport = (options?: { enabled?: boolean }) => {
  return useQuery(costMarginQuery(undefined, options?.enabled ?? true));
};
