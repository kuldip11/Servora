import { apiClient } from '../../../shared/lib/api-client';
import type { Branch } from '@pos/types';

export interface BranchFormInput {
  name: string;
  address?: string;
  phone?: string;
  dineInEnabled: boolean;
  takeawayEnabled: boolean;
  deliveryEnabled: boolean;
  onlineEnabled: boolean;
  tablesEnabled: boolean;
}

export const branchesService = {
  /**
   * Returns every branch authorized by the active franchise access. Branch scope is
   * resolved by the server from the authenticated membership, not a client
   * supplied branch header.
   */
  async list(): Promise<Branch[]> {
    const res = await apiClient.get('/branches');
    return res.data.data;
  },

  async create(input: BranchFormInput): Promise<Branch> {
    const res = await apiClient.post('/branches', input);
    return res.data.data;
  },

  async update(id: string, input: BranchFormInput): Promise<Branch> {
    const res = await apiClient.patch(`/branches/${id}`, input);
    return res.data.data;
  },

  async deactivate(id: string): Promise<void> {
    await apiClient.delete(`/branches/${id}`);
  },
};
