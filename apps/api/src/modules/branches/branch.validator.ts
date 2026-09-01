import { t } from "elysia";

const optionalString = (maxLength: number) =>
  t.Optional(t.Union([t.String({ maxLength }), t.Null()]));
const optionalPercent = t.Optional(
  t.Union([t.Number({ minimum: 0, maximum: 100 }), t.Null()]),
);

export const createBranchBody = t.Object({
  name: t.String({ minLength: 1, maxLength: 200 }),
  code: t.String({ minLength: 2, maxLength: 24, pattern: "^[A-Za-z0-9-]+$" }),
  timezone: t.String({ minLength: 1, maxLength: 64 }),
  currency: t.String({ minLength: 3, maxLength: 3, pattern: "^[A-Za-z]{3}$" }),
  address: t.Optional(t.String()),
  addressLine1: optionalString(300),
  addressLine2: optionalString(300),
  city: optionalString(120),
  stateProvince: optionalString(120),
  postalCode: optionalString(24),
  country: optionalString(2),
  phone: t.Optional(t.String({ maxLength: 30 })),
  managerName: optionalString(150),
  email: optionalString(255),
  openingTime: optionalString(5),
  closingTime: optionalString(5),
  weeklyOperatingDays: t.Optional(
    t.Union([t.Array(t.String(), { maxItems: 7 }), t.Null()]),
  ),
  taxOverride: optionalPercent,
  serviceChargeOverride: optionalPercent,
  invoicePrefix: optionalString(30),
  receiptFooter: optionalString(1000),
  inventoryTrackingEnabled: t.Optional(t.Boolean()),
  negativeStockPolicy: t.Optional(
    t.Union([t.Literal("BLOCK"), t.Literal("ALLOW"), t.Literal("WARN")]),
  ),
  dineInEnabled: t.Optional(t.Boolean()),
  takeawayEnabled: t.Optional(t.Boolean()),
  deliveryEnabled: t.Optional(t.Boolean()),
  onlineEnabled: t.Optional(t.Boolean()),
  tablesEnabled: t.Optional(t.Boolean()),
  customerQrEnabled: t.Optional(t.Boolean()),
  kdsEnabled: t.Optional(t.Boolean()),
  waiterAppEnabled: t.Optional(t.Boolean()),
});

export const updateBranchBody = t.Partial(createBranchBody);

export const branchIdParams = t.Object({ id: t.String() });
