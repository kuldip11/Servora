import { describe, expect, it, vi } from 'vitest';
const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() }));
vi.mock('../../../../shared/lib/api-client', () => ({ apiClient: api }));
import { staffService } from '../staff.service';
import { rolesService } from '../roles.service';
const input = { firstName: 'A', lastName: 'B', email: 'a@b.com', password: 'pw', roleId: 'r1', branchId: '' };

describe('staffService', () => {
  it('lists, adds, removes and updates staff', async () => {
    api.get.mockResolvedValue({ data: { data: ['s'] } }); api.post.mockResolvedValue({}); api.patch.mockResolvedValue({}); api.delete.mockResolvedValue({});
    await expect(staffService.list()).resolves.toEqual(['s']); await staffService.add(input); await staffService.remove('s1'); await staffService.updateStatus('s1', 'ACTIVE');
    expect(api.post).toHaveBeenCalledWith('/staff', { ...input, branchId: undefined }); expect(api.delete).toHaveBeenCalledWith('/staff/s1'); expect(api.patch).toHaveBeenCalledWith('/staff/s1', { status: 'ACTIVE' });
  });
});

describe('rolesService', () => { it('lists roles', async () => { api.get.mockResolvedValue({ data: { data: ['r'] } }); await expect(rolesService.list()).resolves.toEqual(['r']); expect(api.get).toHaveBeenCalledWith('/roles'); }); });
