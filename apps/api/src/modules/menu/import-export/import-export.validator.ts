import { t } from "elysia";

export const exportItemsQuery = t.Object({
  format: t.Optional(t.String()),
  branchId: t.Optional(t.String()),
});

export const exportQuery = t.Object({
  format: t.Optional(t.String()),
});

export const importFileBody = t.Object({
  file: t.File(),
});
