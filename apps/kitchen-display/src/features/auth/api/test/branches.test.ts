import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock('../../../../shared/lib/api-client', () => ({
  apiClient: { get: mocks.get },
}));

import { fetchBranches } from '../branches';

describe('branches api', () => {
  it('fetches branches', async () => {
    mocks.get.mockResolvedValue({ data: { data: [{ id: 'b' }] } });
    await expect(fetchBranches()).resolves.toEqual([{ id: 'b' }]);
    expect(mocks.get).toHaveBeenCalledWith('/branches');
  });
});
