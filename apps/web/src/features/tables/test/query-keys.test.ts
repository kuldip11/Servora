import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../store/auth', () => ({
  useAuthStore: { getState: () => ({ franchiseId: 'fr-1', branchId: 'br-1' }) },
}));

import { tableKeys } from '../query-keys';

describe('tableKeys', () => {
  it('scopes table lists to the active branch context', () => {
    expect(tableKeys.all).toEqual(['tables']);
    expect(tableKeys.list()).toEqual(['tables', 'branch-context', 'fr-1', 'br-1', 'list']);
  });
});
