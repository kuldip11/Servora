import { createStaffApi, type PermissionDto } from "@pos/api-client";
import { apiClient } from "../../../shared/lib/api-client";

const staffApi = createStaffApi(apiClient);
export type Permission = PermissionDto;

export const permissionsService = {
  list: staffApi.listPermissions,
  forRole: staffApi.permissionsForRole,
  setForRole: staffApi.setPermissionsForRole,
};
