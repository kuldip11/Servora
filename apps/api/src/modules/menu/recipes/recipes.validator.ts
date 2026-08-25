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
      inventoryItemId: t.String(),
      quantity: t.Number({ minimum: 0 }),
      unit: INVENTORY_UNIT,
      isOptional: t.Optional(t.Boolean()),
    }),
  ),
});

export const upsertRecipeIngredientBody = t.Object({
  quantity: t.Number({ minimum: 0 }),
  unit: INVENTORY_UNIT,
  isOptional: t.Optional(t.Boolean()),
});

export const itemIdParams = t.Object({
  id: t.String(),
});

export const itemInventoryParams = t.Object({
  id: t.String(),
  inventoryItemId: t.String(),
});
