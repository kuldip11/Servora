import { t } from "elysia";

const ITEM_STATUS = t.Union([
  t.Literal("ACTIVE"),
  t.Literal("OUT_OF_STOCK"),
  t.Literal("HIDDEN"),
  t.Literal("SEASONAL"),
  t.Literal("DISCONTINUED"),
]);
const BULK_MODE = t.Union([
  t.Literal("add"),
  t.Literal("remove"),
  t.Literal("replace"),
]);
const PRICE_MODE = t.Union([
  t.Literal("set"),
  t.Literal("increase"),
  t.Literal("decrease"),
]);

export const bulkStatusBody = t.Object({
  itemIds: t.Array(t.String(), { minItems: 1 }),
  status: ITEM_STATUS,
  reason: t.Optional(t.String()),
});

export const bulkCategoryBody = t.Object({
  itemIds: t.Array(t.String(), { minItems: 1 }),
  categoryId: t.String(),
});

export const bulkTagsBody = t.Object({
  itemIds: t.Array(t.String(), { minItems: 1 }),
  tagIds: t.Array(t.String()),
  mode: BULK_MODE,
});

export const bulkModifiersBody = t.Object({
  itemIds: t.Array(t.String(), { minItems: 1 }),
  modifierGroupIds: t.Array(t.String()),
  mode: BULK_MODE,
});

export const bulkPriceBody = t.Object({
  itemIds: t.Array(t.String(), { minItems: 1 }),
  priceChange: t.Number(),
  mode: PRICE_MODE,
});

export const bulkDeleteBody = t.Object({
  itemIds: t.Array(t.String(), { minItems: 1 }),
});
