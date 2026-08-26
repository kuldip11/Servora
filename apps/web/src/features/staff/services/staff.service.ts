import { apiClient } from "../../../shared/lib/api-client";

export interface StaffFormInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roleId: string;
  branchId?: string | undefined;
}

export const staffService = {
  async list(): Promise<any[]> {
    const res = await apiClient.get("/staff");
    return res.data.data;
  },

  async add(input: StaffFormInput): Promise<void> {
    await apiClient.post("/staff", {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      password: input.password,
      roleId: input.roleId,
      branchIds: input.branchId ? [input.branchId] : [],
    });
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/staff/${id}`);
  },

  async updateStatus(id: string, status: string): Promise<void> {
    await apiClient.patch(`/staff/${id}`, { status });
  },

  async update(
    id: string,
    input: {
      firstName?: string;
      lastName?: string;
      roleId?: string;
      branchIds?: string[];
    },
  ): Promise<void> {
    await apiClient.patch(`/staff/${id}`, input);
  },
};
