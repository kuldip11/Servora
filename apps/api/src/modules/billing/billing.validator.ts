import { t } from 'elysia';

const PAYMENT_METHOD_VALUES = [
  t.Literal('CASH'),
  t.Literal('CARD'),
  t.Literal('UPI'),
  t.Literal('RAZORPAY'),
  t.Literal('STRIPE'),
];

export const createPaymentBody = t.Object({
  orderId: t.String(),
  method: t.Union(PAYMENT_METHOD_VALUES),
  amount: t.Number({ minimum: 0.01 }),
  reference: t.Optional(t.String()),
});

export const createRefundBody = t.Object({
  paymentId: t.String(),
  amount: t.Number({ minimum: 0.01 }),
  reason: t.String({ minLength: 1 }),
});

export const billIdParams = t.Object({
  id: t.String(),
});
