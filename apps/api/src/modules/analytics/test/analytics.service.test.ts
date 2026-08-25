import { beforeEach, describe, expect, it, vi } from 'vitest';
const {countOrdersSince,sumPaidRevenueSince,countActiveOrders,findActiveInventoryItems}=vi.hoisted(()=>({countOrdersSince:vi.fn(),sumPaidRevenueSince:vi.fn(),countActiveOrders:vi.fn(),findActiveInventoryItems:vi.fn()}));
vi.mock('../analytics.repository', () => ({ analyticsRepository:{ countOrdersSince, sumPaidRevenueSince, countActiveOrders, findActiveInventoryItems } }));
import { analyticsService } from '../analytics.service';
const auth=(overrides:any={})=>({ userId:'u1', tenantId:'t1', branchId:'b1', email:'u@example.com', roles:[], permissions:['analytics:read'], ...overrides });
beforeEach(()=>{ vi.clearAllMocks(); countOrdersSince.mockResolvedValue(5); sumPaidRevenueSince.mockResolvedValue(125.5); countActiveOrders.mockResolvedValue(2); findActiveInventoryItems.mockResolvedValue([{currentStock:'2',minimumStock:'5',isActive:true},{currentStock:'10',minimumStock:'5',isActive:true},{currentStock:'5',minimumStock:'5',isActive:true}]); });

describe('analytics service',()=>{
  it('requires permission and scope before querying',async()=>{
    await expect(analyticsService.getDashboard(auth({permissions:[]}))).rejects.toThrow(/Insufficient permissions|access denied/);
    await expect(analyticsService.getDashboard(auth({branchId:null,tenantWide:false}))).rejects.toThrow(/Insufficient permissions|access denied/);
    expect(countOrdersSince).not.toHaveBeenCalled();
  });
  it('assembles dashboard metrics and counts low-stock inventory inclusively',async()=>{
    const result=await analyticsService.getDashboard(auth());
    expect(result).toEqual({ totalOrdersToday:5, revenueToday:125.5, activeOrders:2, lowStockAlerts:2, topItems:[], revenueByHour:[] });
    expect(countOrdersSince).toHaveBeenCalledWith('t1','b1',expect.any(Date));
    expect(sumPaidRevenueSince).toHaveBeenCalledWith('t1','b1',expect.any(Date));
  });
  it('passes null branch through for tenant-wide aggregates',async()=>{
    await analyticsService.getDashboard(auth({branchId:null,tenantWide:true}));
    expect(countOrdersSince).toHaveBeenCalledWith('t1',null,expect.any(Date));
    expect(findActiveInventoryItems).toHaveBeenCalledWith('t1',null);
  });
});
