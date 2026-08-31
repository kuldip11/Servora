import { t } from "elysia";

const SELECTION_TYPE = t.Union([t.Literal("SINGLE"), t.Literal("MULTIPLE")]);

export const createModifierGroupBody = t.Object({
  name: t.String({ minLength: 1 }),
  selectionType: t.Optional(SELECTION_TYPE),
  groupType: t.Optional(
    t.Union([t.Literal("ADDON"), t.Literal("SUBSTITUTION")]),
  ),
  minSelections: t.Optional(t.Number({ minimum: 0 })),
  maxSelections: t.Optional(t.Number({ minimum: 1 })),
  branchId: t.Optional(t.String()),
  options: t.Optional(
    t.Array(
      t.Object({
        name: t.String(),
        additionalPrice: t.Number(),
        maxQuantity: t.Optional(t.Number({ minimum: 1 })),
        isDefault: t.Optional(t.Boolean()),
        replacesDefaultComponent: t.Optional(t.String()),
        variantPrices: t.Optional(
          t.Array(
            t.Object({
              variantId: t.String({ format: "uuid" }),
              additionalPrice: t.Number(),
            }),
          ),
        ),
      }),
    ),
  ),
  dependsOnOptionId: t.Optional(t.Union([t.String(), t.Null()])),
});

export const updateModifierGroupBody = t.Object({
  name: t.Optional(t.String({ minLength: 1 })),
  selectionType: t.Optional(SELECTION_TYPE),
  groupType: t.Optional(
    t.Union([t.Literal("ADDON"), t.Literal("SUBSTITUTION")]),
  ),
  minSelections: t.Optional(t.Number({ minimum: 0 })),
  maxSelections: t.Optional(t.Union([t.Number({ minimum: 1 }), t.Null()])),
  options: t.Optional(
    t.Array(
      t.Object({
        id: t.Optional(t.String()),
        name: t.String(),
        additionalPrice: t.Number(),
        isAvailable: t.Optional(t.Boolean()),
        maxQuantity: t.Optional(t.Number({ minimum: 1 })),
        isDefault: t.Optional(t.Boolean()),
        replacesDefaultComponent: t.Optional(t.String()),
        variantPrices: t.Optional(
          t.Array(
            t.Object({
              variantId: t.String({ format: "uuid" }),
              additionalPrice: t.Number(),
            }),
          ),
        ),
      }),
    ),
  ),
  dependsOnOptionId: t.Optional(t.Union([t.String(), t.Null()])),
});

export const modifierGroupIdParams = t.Object({
  id: t.String(),
});

export const modifierOptionIdParams = t.Object({
  id: t.String(),
});

export const setOptionAvailabilityBody = t.Object({
  isAvailable: t.Boolean(),
});

export const createTagBody = t.Object({
  name: t.String({ minLength: 1, maxLength: 50 }),
  color: t.Optional(t.String()),
});

export const tagIdParams = t.Object({
  id: t.String(),
});
