import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), delete: vi.fn() }));
vi.mock('../../../../shared/lib/api-client', () => ({ apiClient: api }));

import { menuSchedulesService } from '../menu-schedules.service';

describe('menuSchedulesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.post.mockResolvedValue({ data: { data: { id: 'schedule-1' } } });
  });

  it('lists and removes schedules', async () => {
    const schedules = [{ id: 's1' }];
    api.get.mockResolvedValue({ data: { data: schedules } });
    await expect(menuSchedulesService.list('item-1')).resolves.toEqual(schedules);
    await menuSchedulesService.remove('s1');
    expect(api.delete).toHaveBeenCalledWith('/menu/items/schedules/s1');
  });

  it('builds the daily payload with time fields', async () => {
    const input = { scheduleType: 'DAILY' as const, statusDuringPeriod: 'ACTIVE' as never, startTime: '09:00', endTime: '18:00' };
    await menuSchedulesService.add('item-1', input);
    expect(api.post).toHaveBeenCalledWith('/menu/items/item-1/schedules', {
      scheduleType: 'DAILY',
      statusDuringPeriod: 'ACTIVE',
      startTime: '09:00',
      endTime: '18:00',
    });
  });

  it('builds weekly, specific-date, and holiday payloads with their conditional fields', async () => {
    await menuSchedulesService.add('item-1', {
      scheduleType: 'WEEKLY' as const,
      statusDuringPeriod: 'ACTIVE' as never,
      startTime: '10:00',
      endTime: '20:00',
      dayOfWeek: 2,
    });
    expect(api.post).toHaveBeenLastCalledWith('/menu/items/item-1/schedules', expect.objectContaining({ dayOfWeek: 2 }));

    await menuSchedulesService.add('item-1', {
      scheduleType: 'SPECIFIC_DATE' as const,
      statusDuringPeriod: 'INACTIVE' as never,
      startDate: '2026-08-25',
    });
    expect(api.post).toHaveBeenLastCalledWith('/menu/items/item-1/schedules', expect.objectContaining({
      startDate: '2026-08-25',
      endDate: '2026-08-25',
    }));

    await menuSchedulesService.add('item-1', {
      scheduleType: 'HOLIDAY' as const,
      statusDuringPeriod: 'INACTIVE' as never,
      holidayName: 'Diwali',
    });
    expect(api.post).toHaveBeenLastCalledWith('/menu/items/item-1/schedules', expect.objectContaining({
      holidayName: 'Diwali',
    }));
  });
});
