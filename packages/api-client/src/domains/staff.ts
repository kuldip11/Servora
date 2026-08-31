import { getDomainData, patchDomainData, postDomainData, type DomainHttpClient } from "./shared";

export interface PermissionDto {
  id: string;
  key: string;
  module: string;
  description?: string | null;
}

export interface RoleDto {
  id: string;
  name: string;
  description?: string | null;
  scope: "GLOBAL" | "TENANT" | "BRANCH";
  tenantId?: string | null;
  isSystem?: boolean;
  isActive?: boolean;
}

export interface CreateRoleInput {
  name: string;
  description?: string;
  scope: "TENANT" | "BRANCH";
}

export interface StaffRowDto {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  status: string;
  assignedBranches?: { id?: string; name?: string }[];
  roles?: { name?: string; scope?: string }[];
}

export interface AddStaffInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roleId: string;
  branchIds: string[];
}

export interface UpdateStaffInput {
  firstName?: string;
  lastName?: string;
  roleId?: string;
  branchIds?: string[];
}

export function createStaffApi(client: DomainHttpClient) {
  return {
    listStaff(): Promise<StaffRowDto[]> {
      return getDomainData<StaffRowDto[]>(client, "/staff");
    },
    addStaff(input: AddStaffInput): Promise<void> {
      return client.post("/staff", input).then(() => undefined);
    },
    removeStaff(id: string): Promise<void> {
      return client.delete(`/staff/${id}`).then(() => undefined);
    },
    updateStaffStatus(id: string, status: string): Promise<void> {
      return client.patch(`/staff/${id}`, { status }).then(() => undefined);
    },
    updateStaff(id: string, input: UpdateStaffInput): Promise<void> {
      return client.patch(`/staff/${id}`, input).then(() => undefined);
    },
    listRoles(): Promise<RoleDto[]> {
      return getDomainData<RoleDto[]>(client, "/roles");
    },
    createRole(input: CreateRoleInput): Promise<RoleDto> {
      return postDomainData<RoleDto>(client, "/roles", input);
    },
    updateRole(id: string, input: Pick<CreateRoleInput, "name" | "description">): Promise<RoleDto> {
      return patchDomainData<RoleDto>(client, `/roles/${id}`, input);
    },
    archiveRole(id: string): Promise<void> {
      return client.delete(`/roles/${id}`).then(() => undefined);
    },
    listPermissions(): Promise<PermissionDto[]> {
      return getDomainData<PermissionDto[]>(client, "/permissions");
    },
    permissionsForRole(roleId: string): Promise<PermissionDto[]> {
      return getDomainData<PermissionDto[]>(client, `/roles/${roleId}/permissions`);
    },
    setPermissionsForRole(roleId: string, permissionIds: string[]): Promise<void> {
      return client.put(`/roles/${roleId}/permissions`, { permissionIds }).then(() => undefined);
    },
  };
}
