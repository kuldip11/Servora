import { t } from "elysia";
export const loyaltyTierBody = t.Object({
  name: t.String({ minLength: 1, maxLength: 120 }),
  discountPercent: t.Optional(
    t.Union([t.Number({ exclusiveMinimum: 0, maximum: 100 }), t.Null()]),
  ),
  discountFixed: t.Optional(
    t.Union([t.Number({ exclusiveMinimum: 0 }), t.Null()]),
  ),
});
export const updateLoyaltyTierBody = t.Partial(loyaltyTierBody);
export const customerBody = t.Object({
  name: t.String({ minLength: 1, maxLength: 200 }),
  email: t.Optional(t.Union([t.String({ maxLength: 320 }), t.Null()])),
  phone: t.Optional(t.Union([t.String({ maxLength: 40 }), t.Null()])),
  loyaltyTierId: t.Optional(t.Union([t.String({ format: "uuid" }), t.Null()])),
});
export const updateCustomerBody = t.Partial(customerBody);
export const idParams = t.Object({ id: t.String({ format: "uuid" }) });
