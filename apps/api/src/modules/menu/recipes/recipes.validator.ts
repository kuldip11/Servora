import { t } from "elysia";

const INVENTORY_UNIT = t.Union([
  t.Literal("KG"),
  t.Literal("GRAMS"),
  t.Literal("LITERS"),
  t.Literal("ML"),
  t.Literal("PIECES"),
  t.Literal("PACKETS"),
]);

export const setRecipeBody = t.Object({
  ingredients: t.Array(
    t.Object({
      inventoryItemId: t.Optional(t.Union([t.String(), t.Null()])),
      subRecipeId: t.Optional(t.Union([t.String(), t.Null()])),
      variantId: t.Optional(t.Union([t.String(), t.Null()])),
      modifierOptionId: t.Optional(t.Union([t.String(), t.Null()])),
      quantity: t.Number({ minimum: 0 }),
      unit: INVENTORY_UNIT,
      yieldPercent: t.Optional(t.Union([t.Number({ exclusiveMinimum: 0, maximum: 100 }), t.Null()])),
      isOptional: t.Optional(t.Boolean()),
    }),
  ),
});


export const itemIdParams = t.Object({ id: t.String() });
