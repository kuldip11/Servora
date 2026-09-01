import {
  createStaffApi,
  type CreateRoleInput,
  type RoleDto,
} from "@pos/api-client";
import { apiClient } from "@/shared/lib/api-client";

const staffApi = createStaffApi(apiClient);
export type Role = RoleDto;
export type { CreateRoleInput };

export const rolesService = {
  list: staffApi.listRoles,
  create: staffApi.createRole,
  update: staffApi.updateRole,
  archive: staffApi.archiveRole,
};
