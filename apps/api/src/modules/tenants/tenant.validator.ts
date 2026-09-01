import { t } from "elysia";

const optionalString = (maxLength: number) =>
  t.Optional(t.Union([t.String({ maxLength }), t.Null()]));
const optionalPercent = t.Optional(
  t.Union([t.Number({ minimum: 0, maximum: 100 }), t.Null()]),
);

export const createTenantBody = t.Object({
  name: t.String({ minLength: 1, maxLength: 200 }),
  organizationId: t.String({ minLength: 1 }),
  displayName: optionalString(200),
  description: optionalString(2000),
  cuisineTypes: t.Optional(
    t.Array(t.String({ minLength: 1, maxLength: 80 }), { maxItems: 20 }),
  ),
  businessModel: optionalString(50),
  defaultCurrency: optionalString(3),
  defaultTimezone: optionalString(64),
  supportEmail: optionalString(255),
  supportPhone: optionalString(30),
  website: optionalString(500),
  logoUrl: optionalString(1000),
  primaryBrandImageUrl: optionalString(1000),
  defaultTaxMode: t.Optional(
    t.Union([t.Literal("INCLUSIVE"), t.Literal("EXCLUSIVE")]),
  ),
  defaultTaxRate: optionalPercent,
  dineInEnabled: t.Optional(t.Boolean()),
  takeawayEnabled: t.Optional(t.Boolean()),
  deliveryEnabled: t.Optional(t.Boolean()),
  customerQrEnabled: t.Optional(t.Boolean()),
  tableManagementEnabled: t.Optional(t.Boolean()),
  kdsEnabled: t.Optional(t.Boolean()),
  waiterServiceEnabled: t.Optional(t.Boolean()),
});

export const updateTenantBody = t.Object({
  name: t.Optional(t.String({ minLength: 1, maxLength: 200 })),
  displayName: optionalString(200),
  description: optionalString(2000),
  cuisineTypes: t.Optional(
    t.Union([
      t.Array(t.String({ minLength: 1, maxLength: 80 }), { maxItems: 20 }),
      t.Null(),
    ]),
  ),
  businessModel: optionalString(50),
  defaultCurrency: optionalString(3),
  defaultTimezone: optionalString(64),
  supportEmail: optionalString(255),
  supportPhone: optionalString(30),
  website: optionalString(500),
  logoUrl: optionalString(1000),
  primaryBrandImageUrl: optionalString(1000),
  serviceChargePercent: optionalPercent,
  serviceChargeTaxable: t.Optional(t.Boolean()),
  roundingPolicy: t.Optional(
    t.Union([
      t.Literal("NONE"),
      t.Literal("NEAREST_1"),
      t.Literal("NEAREST_5"),
      t.Literal("NEAREST_10"),
    ]),
  ),
  defaultTaxMode: t.Optional(
    t.Union([t.Literal("INCLUSIVE"), t.Literal("EXCLUSIVE")]),
  ),
  defaultTaxRate: optionalPercent,
  dineInEnabled: t.Optional(t.Boolean()),
  takeawayEnabled: t.Optional(t.Boolean()),
  deliveryEnabled: t.Optional(t.Boolean()),
  customerQrEnabled: t.Optional(t.Boolean()),
  tableManagementEnabled: t.Optional(t.Boolean()),
  kdsEnabled: t.Optional(t.Boolean()),
  waiterServiceEnabled: t.Optional(t.Boolean()),
  courseSequencingEnabled: t.Optional(t.Boolean()),
});

export const tenantIdParams = t.Object({ id: t.String() });
