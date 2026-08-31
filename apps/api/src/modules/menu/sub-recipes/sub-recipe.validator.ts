import { t } from "elysia";

const unit = t.Union([
  t.Literal("KG"),
  t.Literal("GRAMS"),
  t.Literal("LITERS"),
  t.Literal("ML"),
  t.Literal("PIECES"),
  t.Literal("PACKETS"),
]);
const ingredient = t.Object({
  inventoryItemId: t.Optional(
    t.Union([t.String({ format: "uuid" }), t.Null()]),
  ),
  ingredientSubRecipeId: t.Optional(
    t.Union([t.String({ format: "uuid" }), t.Null()]),
  ),
  quantity: t.Number({ exclusiveMinimum: 0 }),
  unit,
});
export const subRecipeBody = t.Object({
  name: t.String({ minLength: 1, maxLength: 200 }),
  yieldQuantity: t.Number({ exclusiveMinimum: 0 }),
  yieldUnit: unit,
  yieldPercent: t.Optional(
    t.Union([t.Number({ exclusiveMinimum: 0, maximum: 100 }), t.Null()]),
  ),
  ingredients: t.Array(ingredient),
});
export const subRecipeParams = t.Object({ id: t.String({ format: "uuid" }) });
