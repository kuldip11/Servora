import { queryOptions } from "@tanstack/react-query";
import { branchesService } from "./services/branches.service";
import { branchKeys } from "./query-keys";

export const branchesQuery = () => {
  return queryOptions({
    queryKey: branchKeys.list(),
    queryFn: branchesService.list,
    staleTime: 1000 * 60 * 5,
  });
};
