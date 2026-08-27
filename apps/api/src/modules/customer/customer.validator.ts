import { t } from "elysia";

export const createSessionBody = t.Object({
  qrToken: t.String({ minLength: 1 }),
});

export const customerSessionHeader = t.Object({
  "x-customer-session": t.String({ minLength: 1 }),
});

const customerOrderItem = t.Object({
  menuItemId: t.String({ minLength: 1 }),
  variantId: t.Optional(t.String()),
  quantity: t.Number({ minimum: 1, maximum: 50 }),
  chefNotes: t.Optional(t.String({ maxLength: 500 })),
  fulfillmentType: t.Optional(
    t.Union([t.Literal("DINE_IN"), t.Literal("TAKEAWAY")]),
  ),
  selectedOptions: t.Optional(
    t.Array(
      t.Object({
        optionId: t.String({ minLength: 1 }),
        quantity: t.Optional(t.Number({ minimum: 1, maximum: 20 })),
      }),
      { maxItems: 50 },
    ),
  ),
});

export const createCustomerOrderBody = t.Object({
  items: t.Array(customerOrderItem, { minItems: 1, maxItems: 100 }),
  notes: t.Optional(t.String({ maxLength: 1000 })),
});

export const customerOrderIdParams = t.Object({
  id: t.String({ minLength: 1 }),
});

export const customerCheckoutBody = t.Object({
  method: t.Literal("CASH"),
});

export const takeawayPaymentVerificationBody = t.Object({
  razorpayOrderId: t.String({ minLength: 1 }),
  razorpayPaymentId: t.String({ minLength: 1 }),
  razorpaySignature: t.String({ minLength: 1 }),
});
