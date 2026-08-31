import { t } from "elysia";

const PAYMENT_METHOD_VALUES = [
  t.Literal("CASH"),
  t.Literal("CARD"),
  t.Literal("UPI"),
  t.Literal("RAZORPAY"),
  t.Literal("STRIPE"),
];

export const createPaymentBody = t.Object({
  orderId: t.String(),
  billId: t.Optional(t.String()),
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

export const orderIdParams = t.Object({ id: t.String() });
export const orderItemSeatShareParams = t.Object({ id: t.String({ format: "uuid" }), itemId: t.String({ format: "uuid" }) });
export const itemSeatSharesBody = t.Object({
  shares: t.Array(t.Object({
    seatLabel: t.String({ minLength: 1, maxLength: 50 }),
    shareRatio: t.Number({ exclusiveMinimum: 0, maximum: 1 }),
  }), { minItems: 2, maxItems: 20 }),
});
export const splitBillBody = t.Object({ ways: t.Integer({ minimum: 2, maximum: 20 }) });
export const splitByItemsBody = t.Object({
  allocations: t.Array(t.Object({
    label: t.Optional(t.String({ maxLength: 100 })),
    orderItemIds: t.Array(t.String({ format: "uuid" }), { minItems: 1 }),
  }), { minItems: 2, maxItems: 20 }),
});
export const splitBySeatBody = t.Object({
  sharedItemStrategy: t.Union([t.Literal("EVEN_SPLIT"), t.Literal("MANUAL")]),
});
