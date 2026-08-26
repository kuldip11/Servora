import { apiClient } from "../../../shared/lib/api-client";

export interface Role {
  id: string;
  name: string;
  description: string;
  scope: "GLOBAL" | "TENANT" | "BRANCH";
}

export const rolesService = {
  async list(): Promise<Role[]> {
    const res = await apiClient.get("/roles");
    return res.data.data;
  },
};
