import { describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../../shared/lib/api-client';
import { searchCustomers } from '../customers';

vi.mock('../../../../shared/lib/api-client', () => ({ apiClient: { get: vi.fn() } }));

describe('searchCustomers', () => {
  it('passes the search query and returns customer data', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { data: [{ id: 'c1' }] } } as any);
    await expect(searchCustomers('9876')).resolves.toEqual([{ id: 'c1' }]);
    expect(apiClient.get).toHaveBeenCalledWith('/customers', { params: { search: '9876' } });
  });
});
