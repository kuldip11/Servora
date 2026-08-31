import { useQuery } from "@tanstack/react-query";
import { branchesQuery } from "@/features/branches/query-options";

export const useBranches = (options?: { enabled?: boolean }) => {
  return useQuery({
    ...branchesQuery(),
    ...(options?.enabled !== undefined && { enabled: options.enabled }),
  });
};
