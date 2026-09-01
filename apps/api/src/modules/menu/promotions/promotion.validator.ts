import { t } from "elysia";

const ruleType = t.Union([
  t.Literal("PERCENTAGE"),
  t.Literal("FIXED_AMOUNT"),
  t.Literal("BOGO"),
]);
const scope = t.Union([
  t.Literal("ORDER"),
  t.Literal("CATEGORY"),
  t.Literal("ITEM"),
]);

export const createPromotionBody = t.Object({
  name: t.String({ minLength: 1, maxLength: 200 }),
  ruleType,
  scope,
  scopeCategoryId: t.Optional(
    t.Union([t.String({ format: "uuid" }), t.Null()]),
  ),
  scopeMenuItemId: t.Optional(
    t.Union([t.String({ format: "uuid" }), t.Null()]),
  ),
  value: t.Optional(t.Number({ exclusiveMinimum: 0 })),
  couponCode: t.Optional(
    t.Union([t.String({ minLength: 1, maxLength: 50 }), t.Null()]),
  ),
  startDate: t.Optional(t.Union([t.String({ format: "date" }), t.Null()])),
  endDate: t.Optional(t.Union([t.String({ format: "date" }), t.Null()])),
  startTime: t.Optional(
    t.Union([
      t.String({ pattern: "^([01]\\d|2[0-3]):[0-5]\\d(:[0-5]\\d)?$" }),
      t.Null(),
    ]),
  ),
  endTime: t.Optional(
    t.Union([
      t.String({ pattern: "^([01]\\d|2[0-3]):[0-5]\\d(:[0-5]\\d)?$" }),
      t.Null(),
    ]),
  ),
  maxUsesTotal: t.Optional(t.Union([t.Integer({ minimum: 1 }), t.Null()])),
  maxUsesPerCustomer: t.Optional(
    t.Union([t.Integer({ minimum: 1 }), t.Null()]),
  ),
  triggerMenuItemId: t.Optional(
    t.Union([t.String({ format: "uuid" }), t.Null()]),
  ),
  triggerCategoryId: t.Optional(
    t.Union([t.String({ format: "uuid" }), t.Null()]),
  ),
  rewardMenuItemId: t.Optional(
    t.Union([t.String({ format: "uuid" }), t.Null()]),
  ),
  rewardCategoryId: t.Optional(
    t.Union([t.String({ format: "uuid" }), t.Null()]),
  ),
  rewardDiscountPercent: t.Optional(
    t.Union([t.Number({ exclusiveMinimum: 0, maximum: 100 }), t.Null()]),
  ),
  triggerQuantity: t.Optional(t.Union([t.Integer({ minimum: 1 }), t.Null()])),
  rewardQuantity: t.Optional(t.Union([t.Integer({ minimum: 1 }), t.Null()])),
  stackableWithLoyalty: t.Optional(t.Boolean()),
  isActive: t.Optional(t.Boolean()),
});
export const updatePromotionBody = t.Partial(createPromotionBody);
export const promotionParams = t.Object({ id: t.String({ format: "uuid" }) });

export const promotionPreviewBody = t.Object({
  promotion: createPromotionBody,
  items: t.Array(
    t.Object({
      menuItemId: t.String({ format: "uuid" }),
      variantId: t.Optional(t.String({ format: "uuid" })),
      quantity: t.Integer({ minimum: 1 }),
      selectedOptions: t.Optional(
        t.Array(
          t.Object({
            optionId: t.String({ format: "uuid" }),
            quantity: t.Optional(t.Integer({ minimum: 1 })),
          }),
        ),
      ),
    }),
    { minItems: 1 },
  ),
});
