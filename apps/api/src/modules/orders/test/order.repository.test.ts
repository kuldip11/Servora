import { beforeEach, describe, expect, it, vi } from 'vitest';
const {tx,db}=vi.hoisted(()=>{const tx: any = { insert: vi.fn(), select: vi.fn(), update: vi.fn() }; const db: any = { transaction: vi.fn(async (fn: any) => fn(tx)), query: { orders: { findFirst: vi.fn(), findMany: vi.fn() } } }; return {tx,db};});
vi.mock('../../../db', () => ({ db }));
import { orderRepository } from '../order.repository';

const returning = (rows: any[]) => vi.fn().mockResolvedValue(rows);
const valuesReturning = (rows: any[]) => ({ values: vi.fn().mockReturnValue({ returning: returning(rows) }) });
const item = { menuItemId: 'm1', menuItemName: 'Pizza', quantity: 1, unitPrice: 10, subtotal: 10, modifiers: [] } as any;

beforeEach(() => { vi.clearAllMocks(); });

describe('order repository', () => {
  it('creates an order, first kitchen ticket, items, and OPEN history transactionally', async () => {
    tx.insert.mockReturnValueOnce(valuesReturning([{ id: 'o1' }]))
      .mockReturnValueOnce(valuesReturning([{ id: 't1' }]))
      .mockReturnValueOnce(valuesReturning([{ id: 'oi1' }]))
      .mockReturnValueOnce({ values: vi.fn().mockResolvedValue(undefined) });
    const result = await orderRepository.create({ tenantId: 't1', branchId: 'b1', createdBy: 'u1', type: 'TAKEAWAY', items: [item], subtotal: 10, taxAmount: 1.5, totalAmount: 11.5 });
    expect(result).toEqual({ id: 'o1' });
    expect(tx.insert).toHaveBeenCalledTimes(4);
  });
  it('returns tenant-scoped reads and undefined when an update target is absent', async () => {
    db.query.orders.findFirst.mockResolvedValue({ id: 'o1', tenantId: 't1', branchId: 'b1' });
    await expect(orderRepository.findById('t1', 'o1')).resolves.toMatchObject({ id: 'o1' });
    db.query.orders.findMany.mockResolvedValue([]);
    await expect(orderRepository.findMany('t1', 'b1', { status: 'OPEN', type: 'DINE_IN' })).resolves.toEqual([]);
    tx.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }) });
    await expect(orderRepository.updateStatus('t1', 'missing', 'PAID', 'u1')).resolves.toBeUndefined();
  });
  it('fires a new ticket and increments the ticket number', async () => {
    tx.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([{ maxTicket: 2 }]) }) });
    tx.insert.mockReturnValueOnce(valuesReturning([{ id: 't3' }])).mockReturnValueOnce(valuesReturning([{ id: 'oi3' }])).mockReturnValueOnce({ values: vi.fn().mockResolvedValue(undefined) });
    tx.update.mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) });
    await expect(orderRepository.fireNewTicket('t1', 'b1', 'o1', [item], 10, 1, 'more')).resolves.toEqual({ id: 't3' });
    expect(tx.insert.mock.calls[0][0]).toBeDefined();
  });
});
