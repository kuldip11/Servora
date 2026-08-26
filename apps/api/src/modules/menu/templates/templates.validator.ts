import { t } from "elysia";

export const createFromCategoryBody = t.Object({
  name: t.String({ minLength: 1 }),
  description: t.Optional(t.String()),
});

export const applyTemplateBody = t.Optional(
  t.Object({
    branchId: t.Optional(t.String()),
    categoryName: t.Optional(t.String()),
  }),
);

export const templateIdParams = t.Object({
  id: t.String(),
});

export const categoryIdParams = t.Object({
  categoryId: t.String(),
});
