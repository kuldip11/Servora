import { apiClient } from "../../../shared/lib/api-client";

export interface Permission {
  id: string;
  key: string;
  module: string;
  description?: string | null;
}

export const permissionsService = {
  async list(): Promise<Permission[]> {
    const res = await apiClient.get("/permissions");
    return res.data.data;
  },
  async forRole(roleId: string): Promise<Permission[]> {
    const res = await apiClient.get(`/roles/${roleId}/permissions`);
    return res.data.data;
  },
  async setForRole(roleId: string, permissionIds: string[]): Promise<void> {
    await apiClient.put(`/roles/${roleId}/permissions`, { permissionIds });
  },
};
