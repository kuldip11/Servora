import { describe, expect, it } from 'vitest';
import { createPaymentSchema, createRefundSchema } from '../billing';

const uuid = '550e8400-e29b-41d4-a716-446655440000';

describe('createPaymentSchema', () => {
  it('accepts each supported payment method at the minimum amount', () => {
    for (const method of ['CASH', 'CARD', 'UPI', 'RAZORPAY', 'STRIPE'] as const) {
      expect(createPaymentSchema.safeParse({ orderId: uuid, method, amount: 0.01 }).success).toBe(true);
    }
  });
  it('allows an optional reference', () => {
    expect(createPaymentSchema.parse({ orderId: uuid, method: 'UPI', amount: 10, reference: 'TX-1' }).reference).toBe('TX-1');
  });
  it('rejects invalid UUIDs, methods, and non-positive amounts', () => {
    expect(createPaymentSchema.safeParse({ orderId: 'bad', method: 'CASH', amount: 1 }).success).toBe(false);
    expect(createPaymentSchema.safeParse({ orderId: uuid, method: 'OTHER', amount: 1 }).success).toBe(false);
    expect(createPaymentSchema.safeParse({ orderId: uuid, method: 'CASH', amount: 0 }).success).toBe(false);
  });
});

describe('createRefundSchema', () => {
  it('accepts a valid refund', () => {
    expect(createRefundSchema.safeParse({ paymentId: uuid, amount: 1, reason: 'Customer requested refund' }).success).toBe(true);
  });
  it('requires positive amount and a 1-500 character reason', () => {
    expect(createRefundSchema.safeParse({ paymentId: uuid, amount: 0, reason: 'x' }).success).toBe(false);
    expect(createRefundSchema.safeParse({ paymentId: uuid, amount: 1, reason: '' }).success).toBe(false);
    expect(createRefundSchema.safeParse({ paymentId: uuid, amount: 1, reason: 'x'.repeat(501) }).success).toBe(false);
  });
});
