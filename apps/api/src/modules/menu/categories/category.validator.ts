import { t } from 'elysia';

export const createCategoryBody = t.Object({
  name: t.String({ minLength: 1 }),
  description: t.Optional(t.String()),
  sortOrder: t.Optional(t.Number()),
  branchId: t.Optional(t.String()),
});

export const updateCategoryBody = t.Object({
  name: t.Optional(t.String({ minLength: 1 })),
  description: t.Optional(t.String()),
  sortOrder: t.Optional(t.Number()),
});

export const categoryIdParams = t.Object({
  id: t.String(),
});
