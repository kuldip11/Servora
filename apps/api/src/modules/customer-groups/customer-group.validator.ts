import { t } from "elysia";
export const customerGroupIdParams = t.Object({
  id: t.String({ format: "uuid" }),
});
export const createCustomerGroupBody = t.Object({
  name: t.String({ minLength: 1, maxLength: 150 }),
  discountPercent: t.Optional(
    t.Union([t.Number({ exclusiveMinimum: 0, maximum: 100 }), t.Null()]),
  ),
  discountFixed: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
});
export const updateCustomerGroupBody = t.Partial(createCustomerGroupBody);
