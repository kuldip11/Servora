import { t } from "elysia";

const STATUS_VALUES = [
  t.Literal("AVAILABLE"),
  t.Literal("OCCUPIED"),
  t.Literal("CLEANING"),
  t.Literal("RESERVED"),
];

export const createTableBody = t.Object({
  name: t.String({ minLength: 1, maxLength: 50 }),
  capacity: t.Optional(t.Number({ minimum: 1 })),
  section: t.Optional(t.String()),
  branchId: t.Optional(t.String()),
});

export const updateTableBody = t.Object({
  name: t.Optional(t.String({ minLength: 1, maxLength: 50 })),
  capacity: t.Optional(t.Number({ minimum: 1 })),
  section: t.Optional(t.String()),
  status: t.Optional(t.Union(STATUS_VALUES)),
});

export const updateTableStatusBody = t.Object({
  status: t.Union(STATUS_VALUES),
});

export const tableIdParams = t.Object({
  id: t.String(),
});
