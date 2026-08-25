import { apiClient } from '../../../shared/lib/api-client';
import type { RestaurantTable, TableFormInput } from '../types';

export const tablesService = {
  async list(): Promise<RestaurantTable[]> {
    const res = await apiClient.get('/tables');
    return res.data.data;
  },

  async create(input: TableFormInput): Promise<RestaurantTable> {
    const res = await apiClient.post('/tables', input);
    return res.data.data;
  },

  async update(id: string, input: Omit<TableFormInput, 'branchId'>): Promise<RestaurantTable> {
    const res = await apiClient.patch(`/tables/${id}`, input);
    return res.data.data;
  },

  async updateStatus(id: string, status: string): Promise<RestaurantTable> {
    const res = await apiClient.patch(`/tables/${id}/status`, { status });
    return res.data.data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/tables/${id}`);
  },
};
