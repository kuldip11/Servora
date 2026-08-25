import { describe, expect, it, vi } from 'vitest';
const {list,getById,getInventoryImpact,create,updateStatus,fireTicket}=vi.hoisted(()=>({list:vi.fn(), getById:vi.fn(), getInventoryImpact:vi.fn(), create:vi.fn(), updateStatus:vi.fn(), fireTicket:vi.fn()}));
vi.mock('../order.service', () => ({ orderService: { list, getById, getInventoryImpact, create, updateStatus, fireTicket } }));
import { orderController } from '../order.controller';

const auth = { userId: 'u1', tenantId: 't1', branchId: 'b1', permissions: [] } as any;

describe('order controller', () => {
  it('wraps list, detail, and inventory responses', async () => {
    list.mockResolvedValue([{ id: 'o1' }]); getById.mockResolvedValue({ id: 'o1' }); getInventoryImpact.mockResolvedValue([{ item: 'x' }]);
    await expect(orderController.list(auth, { status: 'OPEN' })).resolves.toEqual({ success: true, data: [{ id: 'o1' }] });
    await expect(orderController.getById(auth, 'o1')).resolves.toEqual({ success: true, data: { id: 'o1' } });
    await expect(orderController.getInventoryImpact(auth, 'o1')).resolves.toEqual({ success: true, data: [{ item: 'x' }] });
  });
  it('uses created response for creation and delegates mutations', async () => {
    create.mockResolvedValue({ id: 'o1' }); updateStatus.mockResolvedValue({ id: 'o1', status: 'PAID' }); fireTicket.mockResolvedValue({ id: 'o1' });
    await expect(orderController.create(auth, { type: 'TAKEAWAY', items: [] })).resolves.toEqual({ success: true, data: { id: 'o1' } });
    await expect(orderController.updateStatus(auth, 'o1', 'PAID', 'paid')).resolves.toEqual({ success: true, data: { id: 'o1', status: 'PAID' } });
    await expect(orderController.fireTicket(auth, 'o1', { items: [] })).resolves.toEqual({ success: true, data: { id: 'o1' } });
  });
});
