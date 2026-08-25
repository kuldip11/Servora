import { useQuery } from '@tanstack/react-query';
import { tablesQuery } from '../query-options';

export function useTables(options?: { enabled?: boolean }) {
  return useQuery({ ...tablesQuery(), ...(options?.enabled !== undefined && { enabled: options.enabled }) });
}
