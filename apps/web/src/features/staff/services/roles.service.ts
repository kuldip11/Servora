import { apiClient } from "../../../shared/lib/api-client";

export interface Role {
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

export const rolesService = {
  async list(): Promise<Role[]> {
    const res = await apiClient.get("/roles");
    return res.data.data;
  },
  async create(input: CreateRoleInput): Promise<Role> {
    const res = await apiClient.post("/roles", input);
    return res.data.data;
  },
  async update(id: string, input: Pick<CreateRoleInput, "name" | "description">): Promise<Role> {
    const res = await apiClient.patch(`/roles/${id}`, input);
    return res.data.data;
  },
  async archive(id: string): Promise<void> {
    await apiClient.delete(`/roles/${id}`);
  },
};
