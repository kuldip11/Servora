import { t } from "elysia";

const channel = t.Union([t.Literal("STAFF"), t.Literal("CUSTOMER_QR")]);
const fulfillmentType = t.Union([
  t.Literal("DINE_IN"),
  t.Literal("TAKEAWAY"),
  t.Literal("DELIVERY"),
  t.Literal("ONLINE"),
]);

export const createPriceRuleBody = t.Object({
  menuItemId: t.Optional(t.Union([t.String({ format: "uuid" }), t.Null()])),
  organizationId: t.Optional(t.Union([t.String({ format: "uuid" }), t.Null()])),
  menuItemSku: t.Optional(
    t.Union([t.String({ minLength: 1, maxLength: 50 }), t.Null()]),
  ),
  customerGroupId: t.Optional(
    t.Union([t.String({ format: "uuid" }), t.Null()]),
  ),
  coverTier: t.Optional(
    t.Union([t.Literal("ADULT"), t.Literal("CHILD"), t.Null()]),
  ),
  isPerCover: t.Optional(t.Boolean()),
  variantId: t.Optional(t.String()),
  branchId: t.Optional(t.String()),
  channel: t.Optional(channel),
  fulfillmentType: t.Optional(fulfillmentType),
  startDate: t.Optional(t.String({ format: "date" })),
  endDate: t.Optional(t.String({ format: "date" })),
  startTime: t.Optional(
    t.String({ pattern: "^([01]\\d|2[0-3]):[0-5]\\d(:[0-5]\\d)?$" }),
  ),
  endTime: t.Optional(
    t.String({ pattern: "^([01]\\d|2[0-3]):[0-5]\\d(:[0-5]\\d)?$" }),
  ),
  price: t.Optional(t.Number({ minimum: 0 })),
  percentOff: t.Optional(t.Number({ exclusiveMinimum: 0, maximum: 100 })),
  taxRate: t.Optional(t.Number({ minimum: 0, maximum: 100 })),
  priority: t.Optional(t.Integer()),
  isActive: t.Optional(t.Boolean()),
  effectiveFrom: t.Optional(t.String()),
});

export const updatePriceRuleBody = t.Partial(createPriceRuleBody);
export const priceRuleParams = t.Object({ id: t.String() });
export const listPriceRulesQuery = t.Object({
  menuItemId: t.Optional(t.String()),
  organizationId: t.Optional(t.String({ format: "uuid" })),
  menuItemSku: t.Optional(t.String()),
});

export const createHappyHourBody = t.Object({
  categoryId: t.Optional(t.String({ format: "uuid" })),
  menuId: t.Optional(t.String({ format: "uuid" })),
  percentOff: t.Number({ exclusiveMinimum: 0, maximum: 100 }),
  startTime: t.String({ pattern: "^([01]\\d|2[0-3]):[0-5]\\d(:[0-5]\\d)?$" }),
  endTime: t.String({ pattern: "^([01]\\d|2[0-3]):[0-5]\\d(:[0-5]\\d)?$" }),
  startDate: t.Optional(t.String({ format: "date" })),
  endDate: t.Optional(t.String({ format: "date" })),
  branchId: t.Optional(t.String({ format: "uuid" })),
  channel: t.Optional(channel),
  fulfillmentType: t.Optional(fulfillmentType),
  priority: t.Optional(t.Integer()),
});
