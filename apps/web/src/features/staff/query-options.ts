import { queryOptions } from "@tanstack/react-query";
import { staffService } from "./services/staff.service";
import { rolesService } from "./services/roles.service";
import { staffKeys, roleKeys } from "./query-keys";

export function staffListQuery() {
  return queryOptions({
    queryKey: staffKeys.list(),
    queryFn: staffService.list,
  });
}

export function rolesListQuery() {
  return queryOptions({
    queryKey: roleKeys.list(),
    queryFn: rolesService.list,
    staleTime: 1000 * 60 * 10,
  });
}
