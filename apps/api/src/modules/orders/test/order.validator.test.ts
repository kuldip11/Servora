import { describe, expect, it } from 'vitest';
import { Value } from '@sinclair/typebox/value';
import { createOrderBody, updateOrderStatusBody, fireTicketBody, orderIdParams, orderListQuery } from '../order.validator';

describe('order validators', () => {
  const item = { menuItemId: 'm1', quantity: 1 };
  it('accepts valid order creation and rejects invalid type/quantity', () => {
    expect(Value.Check(createOrderBody, { type: 'DINE_IN', tableId: 't1', items: [item] })).toBe(true);
    expect(Value.Check(createOrderBody, { type: 'BAD', items: [item] })).toBe(false);
    expect(Value.Check(createOrderBody, { type: 'TAKEAWAY', items: [{ ...item, quantity: 0 }] })).toBe(false);
  });
  it('validates status, ticket, id, and optional filters', () => {
    expect(Value.Check(updateOrderStatusBody, { status: 'PAID' })).toBe(true);
    expect(Value.Check(updateOrderStatusBody, { status: 'NOPE' })).toBe(false);
    expect(Value.Check(fireTicketBody, { items: [item] })).toBe(true);
    expect(Value.Check(orderIdParams, { id: 'o1' })).toBe(true);
    expect(Value.Check(orderIdParams, {})).toBe(false);
    expect(Value.Check(orderListQuery, { status: 'OPEN', type: 'DINE_IN' })).toBe(true);
  });
});
