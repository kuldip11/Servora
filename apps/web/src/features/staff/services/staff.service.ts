import { apiClient } from '../../../shared/lib/api-client';

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
    const res = await apiClient.get('/staff');
    return res.data.data;
  },

  async add(input: StaffFormInput): Promise<void> {
    await apiClient.post('/staff', { ...input, branchId: input.branchId || undefined });
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/staff/${id}`);
  },

  async updateStatus(id: string, status: string): Promise<void> {
    await apiClient.patch(`/staff/${id}`, { status });
  },
};
