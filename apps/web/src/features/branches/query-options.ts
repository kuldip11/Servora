import { queryOptions } from "@tanstack/react-query";
import { branchesService } from "./services/branches.service";
import { branchKeys } from "./query-keys";

/**
 * Reusable query definition — usable with `useQuery`, and also for
 * prefetching (`queryClient.prefetchQuery(branchesQuery())`) or reading
 * from the cache directly, without redefining the queryKey/queryFn pair.
 */
export function branchesQuery() {
  return queryOptions({
    queryKey: branchKeys.list(),
    queryFn: branchesService.list,
    staleTime: 1000 * 60 * 5,
  });
}
