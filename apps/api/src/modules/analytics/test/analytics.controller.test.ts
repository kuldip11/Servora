import { describe, expect, it, vi } from 'vitest';
const {getDashboard}=vi.hoisted(()=>({getDashboard:vi.fn()}));
vi.mock('../analytics.service', () => ({ analyticsService:{ getDashboard } }));
import { analyticsController } from '../analytics.controller';
const auth = { userId:'u1', tenantId:'t1', branchId:'b1', email:'u@example.com', roles:[], permissions:[] } as any;

describe('analytics controller', () => {
  it('delegates dashboard reads and returns the success envelope', async () => {
    const dashboard = { totalOrdersToday:4, revenueToday:20, activeOrders:2, lowStockAlerts:1, topItems:[], revenueByHour:[] };
    getDashboard.mockResolvedValue(dashboard);
    await expect(analyticsController.getDashboard(auth)).resolves.toEqual({ success:true, data:dashboard });
    expect(getDashboard).toHaveBeenCalledWith(auth);
  });
  it('preserves service failures', async () => {
    getDashboard.mockRejectedValue(new Error('FORBIDDEN'));
    await expect(analyticsController.getDashboard(auth)).rejects.toThrow('FORBIDDEN');
  });
});
