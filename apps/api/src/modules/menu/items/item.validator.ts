import { t } from "elysia";

const FOOD_TYPE = t.Union([
  t.Literal("VEG"),
  t.Literal("NON_VEG"),
  t.Literal("EGG"),
]);
const SPICE_LEVEL = t.Union([
  t.Literal("NONE"),
  t.Literal("MILD"),
  t.Literal("MEDIUM"),
  t.Literal("HOT"),
]);
const ITEM_STATUS = t.Union([
  t.Literal("ACTIVE"),
  t.Literal("OUT_OF_STOCK"),
  t.Literal("HIDDEN"),
  t.Literal("SEASONAL"),
  t.Literal("DISCONTINUED"),
]);

export const createItemBody = t.Object({
  categoryId: t.String(),
  name: t.String({ minLength: 1 }),
  description: t.Optional(t.String()),
  basePrice: t.Number({ minimum: 0 }),
  taxRate: t.Optional(t.Number()),
  branchId: t.Optional(t.String()),
  foodType: t.Optional(FOOD_TYPE),
  spiceLevel: t.Optional(SPICE_LEVEL),
  sku: t.Optional(t.String()),
  prepTimeMinutes: t.Optional(t.Number({ minimum: 0 })),
  sortOrder: t.Optional(t.Number()),
  hsnCode: t.Optional(t.String()),
  status: t.Optional(ITEM_STATUS),
  enableRecipeDeduction: t.Optional(t.Boolean()),
  isPublished: t.Optional(t.Boolean()),
  // Absolute price for the item when this variant is picked (e.g.
  // "Half" -> 200, "Full" -> 400) — not an add-on to basePrice.
  variants: t.Optional(
    t.Array(t.Object({ name: t.String(), price: t.Number({ minimum: 0 }) })),
  ),
  modifierGroupIds: t.Optional(t.Array(t.String())),
  tagIds: t.Optional(t.Array(t.String())),
  allergenIds: t.Optional(t.Array(t.String())),
  imageUrls: t.Optional(t.Array(t.String())),
});

export const updateItemBody = t.Object({
  name: t.Optional(t.String()),
  description: t.Optional(t.String()),
  basePrice: t.Optional(t.Number()),
  taxRate: t.Optional(t.Number()),
  isAvailable: t.Optional(t.Boolean()),
  foodType: t.Optional(FOOD_TYPE),
  spiceLevel: t.Optional(t.Union([SPICE_LEVEL, t.Null()])),
  sku: t.Optional(t.Union([t.String(), t.Null()])),
  prepTimeMinutes: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
  sortOrder: t.Optional(t.Number()),
  hsnCode: t.Optional(t.Union([t.String(), t.Null()])),
  status: t.Optional(ITEM_STATUS),
  availabilityReason: t.Optional(t.Union([t.String(), t.Null()])),
  enableRecipeDeduction: t.Optional(t.Boolean()),
  tagIds: t.Optional(t.Array(t.String())),
  allergenIds: t.Optional(t.Array(t.String())),
  modifierGroupIds: t.Optional(t.Array(t.String())),
  imageUrls: t.Optional(t.Array(t.String())),
});

export const duplicateItemBody = t.Optional(
  t.Object({
    name: t.Optional(t.String()),
    copyRecipes: t.Optional(t.Boolean()),
    copySchedules: t.Optional(t.Boolean()),
    copyModifiers: t.Optional(t.Boolean()),
  }),
);

export const updateItemStatusBody = t.Object({
  status: ITEM_STATUS,
  reason: t.Optional(t.String()),
});

export const updateItemAvailabilityBody = t.Object({
  isAvailable: t.Boolean(),
  reason: t.Optional(t.String()),
});

export const itemIdParams = t.Object({
  id: t.String(),
});

export const itemStatusParams = t.Object({
  status: ITEM_STATUS,
});

export const itemStatusQuery = t.Object({
  categoryId: t.Optional(t.String()),
});
