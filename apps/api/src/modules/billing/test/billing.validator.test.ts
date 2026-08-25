import { describe, expect, it } from 'vitest';
import { Value } from '@sinclair/typebox/value';
import { billIdParams, createPaymentBody, createRefundBody } from '../billing.validator';

describe('billing validators', () => {
  it('accepts valid payment payloads and rejects invalid amounts/methods', () => {
    expect(Value.Check(createPaymentBody, { orderId: 'o1', method: 'CARD', amount: 10 })).toBe(true);
    expect(Value.Check(createPaymentBody, { orderId: 'o1', method: 'BITCOIN', amount: 10 })).toBe(false);
    expect(Value.Check(createPaymentBody, { orderId: 'o1', method: 'CARD', amount: 0 })).toBe(false);
  });
  it('accepts optional payment references', () => {
    expect(Value.Check(createPaymentBody, { orderId: 'o1', method: 'UPI', amount: 1, reference: 'ref-1' })).toBe(true);
  });
  it('enforces refund fields and positive amount', () => {
    expect(Value.Check(createRefundBody, { paymentId: 'p1', amount: 1, reason: 'Customer request' })).toBe(true);
    expect(Value.Check(createRefundBody, { paymentId: 'p1', amount: 0, reason: 'Customer request' })).toBe(false);
    expect(Value.Check(createRefundBody, { paymentId: 'p1', amount: 1, reason: '' })).toBe(false);
  });
  it('requires the bill id parameter', () => {
    expect(Value.Check(billIdParams, { id: 'b1' })).toBe(true);
    expect(Value.Check(billIdParams, {})).toBe(false);
  });
});
