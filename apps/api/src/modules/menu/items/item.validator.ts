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
const PRICING_MODE = t.Union([
  t.Literal("FIXED"),
  t.Literal("WEIGHT_BASED"),
  t.Literal("OPEN"),
]);
const WEIGHT_UNIT = t.Union([
  t.Literal("G"),
  t.Literal("KG"),
  t.Literal("LB"),
  t.Literal("OZ"),
]);
const ZONE_PRICING_RULE = t.Union([
  t.Literal("AVERAGE"),
  t.Literal("HIGHER"),
  t.Literal("SUM_HALF"),
]);
const TAX_MODE = t.Union([t.Literal("INCLUSIVE"), t.Literal("EXCLUSIVE")]);
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
  description: t.Optional(t.Union([t.String(), t.Null()])),
  basePrice: t.Number({ minimum: 0 }),
  manualCost: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
  pricingMode: t.Optional(PRICING_MODE),
  weightUnit: t.Optional(WEIGHT_UNIT),
  openPriceMin: t.Optional(t.Number({ minimum: 0 })),
  openPriceMax: t.Optional(t.Number({ minimum: 0 })),
  supportsZones: t.Optional(t.Boolean()),
  zonePricingRule: t.Optional(ZONE_PRICING_RULE),
  manualStockCount: t.Optional(t.Number({ minimum: 0 })),
  taxRate: t.Optional(t.Number()),
  taxMode: t.Optional(t.Union([TAX_MODE, t.Null()])),
  branchId: t.Optional(t.String()),
  foodType: t.Optional(FOOD_TYPE),
  spiceLevel: t.Optional(t.Union([SPICE_LEVEL, t.Null()])),
  sku: t.Optional(t.Union([t.String(), t.Null()])),
  prepTimeMinutes: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
  sortOrder: t.Optional(t.Number()),
  hsnCode: t.Optional(t.Union([t.String(), t.Null()])),
  status: t.Optional(ITEM_STATUS),
  enableRecipeDeduction: t.Optional(t.Boolean()),
  isPublished: t.Optional(t.Boolean()),
  displayMode: t.Optional(
    t.Union([t.Literal("STANDARD"), t.Literal("GUIDED_BUILDER")]),
  ),
  effectiveFrom: t.Optional(t.Union([t.String(), t.Null()])),
  availabilityReason: t.Optional(t.Union([t.String(), t.Null()])),

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
  description: t.Optional(t.Union([t.String(), t.Null()])),
  basePrice: t.Optional(t.Number({ minimum: 0 })),
  manualCost: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
  pricingMode: t.Optional(PRICING_MODE),
  weightUnit: t.Optional(t.Union([WEIGHT_UNIT, t.Null()])),
  openPriceMin: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
  openPriceMax: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
  supportsZones: t.Optional(t.Boolean()),
  zonePricingRule: t.Optional(ZONE_PRICING_RULE),
  manualStockCount: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
  taxRate: t.Optional(t.Number()),
  taxMode: t.Optional(t.Union([TAX_MODE, t.Null()])),
  foodType: t.Optional(FOOD_TYPE),
  spiceLevel: t.Optional(t.Union([SPICE_LEVEL, t.Null()])),
  sku: t.Optional(t.Union([t.String(), t.Null()])),
  prepTimeMinutes: t.Optional(t.Union([t.Number({ minimum: 0 }), t.Null()])),
  sortOrder: t.Optional(t.Number()),
  hsnCode: t.Optional(t.Union([t.String(), t.Null()])),
  status: t.Optional(ITEM_STATUS),
  availabilityReason: t.Optional(t.Union([t.String(), t.Null()])),
  enableRecipeDeduction: t.Optional(t.Boolean()),
  displayMode: t.Optional(
    t.Union([t.Literal("STANDARD"), t.Literal("GUIDED_BUILDER")]),
  ),
  effectiveFrom: t.Optional(t.Union([t.String(), t.Null()])),
  tagIds: t.Optional(t.Array(t.String())),
  allergenIds: t.Optional(t.Array(t.String())),
  modifierGroupIds: t.Optional(t.Array(t.String())),
  imageUrls: t.Optional(t.Array(t.String())),
  variants: t.Optional(
    t.Array(
      t.Object({
        id: t.Optional(t.String()),
        name: t.String(),
        price: t.Number({ minimum: 0 }),
      }),
    ),
  ),
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
