import { describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('../../../../shared/lib/api-client', () => ({ apiClient: api }));
import { analyticsService } from '../analytics.service';

describe('analyticsService', () => {
  it('returns dashboard data', async () => {
    const data = { revenue: 1200, orders: 10 };
    api.get.mockResolvedValue({ data: { data } });
    await expect(analyticsService.dashboard()).resolves.toEqual(data);
    expect(api.get).toHaveBeenCalledWith('/analytics/dashboard');
  });
});
