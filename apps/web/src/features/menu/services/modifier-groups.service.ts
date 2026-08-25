import { apiClient } from '../../../shared/lib/api-client';
import type { ModifierGroup } from '@pos/types';

export interface ModifierGroupPayload {
  name: string;
  selectionType: 'SINGLE' | 'MULTIPLE';
  minSelections: number;
  maxSelections?: number;
  options: { name: string; additionalPrice: number; maxQuantity: number }[];
}

export const modifierGroupsService = {
  async list(): Promise<ModifierGroup[]> {
    const res = await apiClient.get('/menu/modifier-groups');
    return res.data.data;
  },

  async save(existingId: string | null, payload: ModifierGroupPayload): Promise<ModifierGroup> {
    const res = existingId
      ? await apiClient.patch(`/menu/modifier-groups/${existingId}`, payload)
      : await apiClient.post('/menu/modifier-groups', payload);
    return res.data.data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/menu/modifier-groups/${id}`);
  },
};
