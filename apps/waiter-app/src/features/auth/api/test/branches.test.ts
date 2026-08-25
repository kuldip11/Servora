import { describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../../shared/lib/api-client';
import { fetchBranches } from '../branches';

vi.mock('../../../../shared/lib/api-client', () => ({
  apiClient: { get: vi.fn() },
}));

describe('fetchBranches', () => {
  it('returns the API data payload', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { data: [{ id: 'b1' }] } } as any);
    await expect(fetchBranches()).resolves.toEqual([{ id: 'b1' }]);
    expect(apiClient.get).toHaveBeenCalledWith('/branches');
  });
});
