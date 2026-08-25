import { describe, expect, it, vi } from 'vitest';
const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() }));
vi.mock('../../../../shared/lib/api-client', () => ({ apiClient: api }));
import { tablesService } from '../tables.service';
const input = { name: 'T1', capacity: 4, branchId: 'b1' } as any;

describe('tablesService', () => {
  it('lists and creates tables', async () => { api.get.mockResolvedValue({ data: { data: ['t'] } }); api.post.mockResolvedValue({ data: { data: { id: 't1' } } }); await expect(tablesService.list()).resolves.toEqual(['t']); await expect(tablesService.create(input)).resolves.toEqual({ id: 't1' }); expect(api.post).toHaveBeenCalledWith('/tables', input); });
  it('updates table details and status', async () => { api.patch.mockResolvedValue({ data: { data: { id: 't1' } } }); await expect(tablesService.update('t1', { name: 'T2', capacity: 6 } as any)).resolves.toEqual({ id: 't1' }); await expect(tablesService.updateStatus('t1', 'OCCUPIED')).resolves.toEqual({ id: 't1' }); expect(api.patch).toHaveBeenCalledWith('/tables/t1/status', { status: 'OCCUPIED' }); });
  it('removes a table', async () => { api.delete.mockResolvedValue({}); await tablesService.remove('t1'); expect(api.delete).toHaveBeenCalledWith('/tables/t1'); });
});
