import { apiClient } from '../../../shared/lib/api-client';
import type { MenuTag } from '@pos/types';

export const menuTagsService = {
  async list(): Promise<MenuTag[]> {
    const res = await apiClient.get('/menu/tags');
    return res.data.data;
  },

  async create(name: string, color: string): Promise<MenuTag> {
    const res = await apiClient.post('/menu/tags', { name, color });
    return res.data.data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/menu/tags/${id}`);
  },
};
