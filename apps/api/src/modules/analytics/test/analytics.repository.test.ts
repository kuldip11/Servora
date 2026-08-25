import { beforeEach, describe, expect, it, vi } from 'vitest';
const {select,query}=vi.hoisted(()=>({select:vi.fn(),query:{inventoryItems:{findMany:vi.fn()}}}));
vi.mock('../../../db', () => ({ db:{ select, query } }));
import { analyticsRepository } from '../analytics.repository';

const chain = (rows:any[]) => {
  const where = vi.fn().mockResolvedValue(rows);
  const from = vi.fn().mockReturnValue({ where });
  select.mockReturnValue({ from });
  return { from, where };
};
beforeEach(() => { vi.clearAllMocks(); });

describe('analytics repository', () => {
  it('counts orders with tenant, optional branch, and since filters', async () => {
    chain([{ count:7 }]);
    await expect(analyticsRepository.countOrdersSince('t1','b1',new Date('2026-01-01'))).resolves.toBe(7);
    expect(select).toHaveBeenCalled();
    chain([]);
    await expect(analyticsRepository.countOrdersSince('t1',null,new Date())).resolves.toBe(0);
  });
  it('sums paid revenue and defaults missing totals to zero', async () => {
    chain([{ total:'123.45' }]);
    await expect(analyticsRepository.sumPaidRevenueSince('t1',null,new Date())).resolves.toBe(123.45);
    chain([{ total:null }]);
    await expect(analyticsRepository.sumPaidRevenueSince('t1','b1',new Date())).resolves.toBe(0);
  });
  it('counts active orders and finds only active inventory items', async () => {
    chain([{ count:3 }]);
    await expect(analyticsRepository.countActiveOrders('t1','b1')).resolves.toBe(3);
    query.inventoryItems.findMany.mockResolvedValue([{ id:'i1', currentStock:'2', minimumStock:'5', isActive:true }]);
    await expect(analyticsRepository.findActiveInventoryItems('t1',null)).resolves.toEqual([{ id:'i1', currentStock:'2', minimumStock:'5', isActive:true }]);
    expect(query.inventoryItems.findMany).toHaveBeenCalledTimes(1);
  });
});
