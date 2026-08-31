import { t } from "elysia";

export const createTenantBody = t.Object({
  name: t.String({ minLength: 1, maxLength: 200 }),
  organizationId: t.String({ minLength: 1 }),
});

export const updateTenantBody = t.Object({
  name: t.Optional(t.String({ minLength: 1, maxLength: 200 })),
  serviceChargePercent: t.Optional(t.Union([t.Number({ minimum: 0, maximum: 100 }), t.Null()])),
  serviceChargeTaxable: t.Optional(t.Boolean()),
  roundingPolicy: t.Optional(t.Union([
    t.Literal("NONE"), t.Literal("NEAREST_1"), t.Literal("NEAREST_5"), t.Literal("NEAREST_10"),
  ])),
  defaultTaxMode: t.Optional(t.Union([t.Literal("INCLUSIVE"), t.Literal("EXCLUSIVE")])),
  courseSequencingEnabled: t.Optional(t.Boolean()),
});

export const tenantIdParams = t.Object({ id: t.String() });
