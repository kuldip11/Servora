import { useQuery } from "@tanstack/react-query";
import { fetchTables } from "@/features/menu/api/tables";

export const useTables = (enabled: boolean) => {
  return useQuery({
    queryKey: ["tables"],
    queryFn: fetchTables,
    enabled,
    refetchInterval: 20_000,
  });
};
