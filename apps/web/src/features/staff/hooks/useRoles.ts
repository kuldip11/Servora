import { useQuery } from '@tanstack/react-query';
import { rolesListQuery } from '../query-options';

export function useRoles() {
  return useQuery(rolesListQuery());
}
