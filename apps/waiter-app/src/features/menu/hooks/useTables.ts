import { useQuery } from '@tanstack/react-query';
import { fetchTables } from '../api/tables';

export function useTables(enabled: boolean) {
  return useQuery({
    queryKey: ['tables'],
    queryFn: fetchTables,
    enabled,
    refetchInterval: 20_000,
  });
}
