import { useQuery } from "@tanstack/react-query";
import { tablesQuery } from "@/features/tables/query-options";

export const useTables = (options?: { enabled?: boolean }) => {
  return useQuery({
    ...tablesQuery(),
    ...(options?.enabled !== undefined && { enabled: options.enabled }),
  });
};
