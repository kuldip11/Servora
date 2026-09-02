import { queryOptions } from "@tanstack/react-query";
import { staffService } from "./services/staff.service";
import { rolesService } from "./services/roles.service";
import { staffKeys, roleKeys } from "./query-keys";

import type { StaffListFilters } from "@pos/api-client";

export const staffListQuery = (filters: StaffListFilters = {}) => {
  const hasFilters = Object.keys(filters).length > 0;
  return queryOptions({
    queryKey: hasFilters ? [...staffKeys.list(), filters] : staffKeys.list(),
    queryFn: () => staffService.list(filters),
  });
};

export const rolesListQuery = () => {
  return queryOptions({
    queryKey: roleKeys.list(),
    queryFn: rolesService.list,
    staleTime: 1000 * 60 * 10,
  });
};
