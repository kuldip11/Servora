import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  patch: vi.fn(),
}));

vi.mock('../../../../shared/lib/api-client', () => ({
  apiClient: { get: mocks.get, patch: mocks.patch },
}));

import { fetchKitchenTickets, updateTicketStatus } from '../tickets';

describe('tickets api', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches tickets', async () => {
    mocks.get.mockResolvedValue({ data: { data: [{ id: '1' }] } });
    await expect(fetchKitchenTickets()).resolves.toEqual([{ id: '1' }]);
    expect(mocks.get).toHaveBeenCalledWith('/kitchen-tickets');
  });

  it('updates status', async () => {
    mocks.patch.mockResolvedValue({});
    await updateTicketStatus('1', 'READY');
    expect(mocks.patch).toHaveBeenCalledWith('/kitchen-tickets/1/status', { status: 'READY' });
  });
});
