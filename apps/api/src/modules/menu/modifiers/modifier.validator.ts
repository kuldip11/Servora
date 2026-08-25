import { t } from 'elysia';

const SELECTION_TYPE = t.Union([t.Literal('SINGLE'), t.Literal('MULTIPLE')]);

export const createModifierGroupBody = t.Object({
  name: t.String({ minLength: 1 }),
  selectionType: t.Optional(SELECTION_TYPE),
  minSelections: t.Optional(t.Number({ minimum: 0 })),
  maxSelections: t.Optional(t.Number({ minimum: 1 })),
  branchId: t.Optional(t.String()),
  options: t.Optional(
    t.Array(
      t.Object({
        name: t.String(),
        additionalPrice: t.Number({ minimum: 0 }),
        maxQuantity: t.Optional(t.Number({ minimum: 1 })),
      }),
    ),
  ),
});

export const updateModifierGroupBody = t.Object({
  name: t.Optional(t.String({ minLength: 1 })),
  selectionType: t.Optional(SELECTION_TYPE),
  minSelections: t.Optional(t.Number({ minimum: 0 })),
  maxSelections: t.Optional(t.Union([t.Number({ minimum: 1 }), t.Null()])),
  options: t.Optional(
    t.Array(
      t.Object({
        name: t.String(),
        additionalPrice: t.Number({ minimum: 0 }),
        isAvailable: t.Optional(t.Boolean()),
        maxQuantity: t.Optional(t.Number({ minimum: 1 })),
      }),
    ),
  ),
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
