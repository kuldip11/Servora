import { useQuery } from '@tanstack/react-query';
import { branchesQuery } from '../query-options';

export function useBranches(options?: { enabled?: boolean }) {
  return useQuery({ ...branchesQuery(), ...(options?.enabled !== undefined && { enabled: options.enabled }) });
}
