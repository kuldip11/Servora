import { describe, expect, it } from 'vitest';
import { formatCurrency, isOrderActive, isOrderReady, shortOrderId } from '../orderHelpers';

const order = (overrides: any = {}) => ({
  id: 'order-abcdef123456',
  status: 'OPEN',
  kitchenTickets: [],
  ...overrides,
});

describe('order helpers', () => {
  it('formats ids and currency', () => {
    expect(shortOrderId('order-abcdef123456')).toBe('#123456');
    expect(formatCurrency(12)).toBe('₹12.00');
    expect(formatCurrency('12.5')).toBe('₹12.50');
  });

  it('detects ready and active orders from public status data', () => {
    expect(isOrderReady(order({ kitchenTickets: [{ status: 'READY' }] }))).toBe(true);
    expect(isOrderReady(order())).toBe(false);
    expect(isOrderActive(order())).toBe(true);
    expect(isOrderActive(order({ status: 'BILL_REQUESTED' }))).toBe(true);
    expect(isOrderActive(order({ status: 'PAID' }))).toBe(false);
  });
});
