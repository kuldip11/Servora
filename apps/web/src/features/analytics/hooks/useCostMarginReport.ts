import { useQuery } from "@tanstack/react-query";
import { costMarginQuery } from "../query-options";

export function useCostMarginReport(options?: { enabled?: boolean }) {
  return useQuery(costMarginQuery(undefined, options?.enabled ?? true));
}
