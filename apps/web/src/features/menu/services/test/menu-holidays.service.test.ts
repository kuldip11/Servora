import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), delete: vi.fn() }));
vi.mock('../../../../shared/lib/api-client', () => ({ apiClient: api }));

import { menuHolidaysService } from '../menu-holidays.service';

describe('menuHolidaysService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lists holidays', async () => {
    const holidays = [{ id: 'h1', name: 'Diwali' }];
    api.get.mockResolvedValue({ data: { data: holidays } });
    await expect(menuHolidaysService.list()).resolves.toEqual(holidays);
    expect(api.get).toHaveBeenCalledWith('/menu/holidays');
  });

  it('adds and removes holidays', async () => {
    const input = { name: 'Diwali', holidayDate: '2026-11-08', region: 'IN' };
    const holiday = { id: 'h1', ...input };
    api.post.mockResolvedValue({ data: { data: holiday } });
    await expect(menuHolidaysService.add(input)).resolves.toEqual(holiday);
    expect(api.post).toHaveBeenCalledWith('/menu/holidays', input);

    await menuHolidaysService.remove('h1');
    expect(api.delete).toHaveBeenCalledWith('/menu/holidays/h1');
  });
});
