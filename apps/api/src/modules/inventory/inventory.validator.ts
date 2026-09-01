import { t } from "elysia";

const UNIT_VALUES = [
  t.Literal("KG"),
  t.Literal("GRAMS"),
  t.Literal("LITERS"),
  t.Literal("ML"),
  t.Literal("PIECES"),
  t.Literal("PACKETS"),
];

const TRANSACTION_TYPE_VALUES = [
  t.Literal("IN"),
  t.Literal("OUT"),
  t.Literal("ADJUSTMENT"),
  t.Literal("WASTE"),
];

export const createInventoryItemBody = t.Object({
  name: t.String({ minLength: 1 }),
  unit: t.Union(UNIT_VALUES),
  currentStock: t.Number({ minimum: 0 }),
  minimumStock: t.Number({ minimum: 0 }),
  reorderPoint: t.Number({ minimum: 0 }),
  costPerUnit: t.Number({ minimum: 0 }),
  branchId: t.Optional(t.String()),
});

export const updateStockBody = t.Object({
  quantity: t.Number(),
  transactionType: t.Union(TRANSACTION_TYPE_VALUES),
  notes: t.Optional(t.String()),
  wasteReasonId: t.Optional(t.String()),
});

export const logWasteBody = t.Object({
  quantity: t.Number({ exclusiveMinimum: 0 }),
  wasteReasonId: t.String({ minLength: 1 }),
  notes: t.Optional(t.String()),
});

export const createWasteReasonBody = t.Object({
  label: t.String({ minLength: 1, maxLength: 150 }),
});

export const updateWasteReasonBody = t.Object({
  label: t.Optional(t.String({ minLength: 1, maxLength: 150 })),
  isActive: t.Optional(t.Boolean()),
});

export const inventoryItemIdParams = t.Object({
  id: t.String(),
});
