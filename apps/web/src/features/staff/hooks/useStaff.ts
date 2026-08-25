import { useQuery } from '@tanstack/react-query';
import { staffListQuery } from '../query-options';

export function useStaff() {
  return useQuery(staffListQuery());
}
