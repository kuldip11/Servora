import { t } from "elysia";

export const createTenantBody = t.Object({
  name: t.String({ minLength: 1, maxLength: 200 }),
  organizationId: t.String({ minLength: 1 }),
});

export const updateTenantBody = t.Object({
  name: t.Optional(t.String({ minLength: 1, maxLength: 200 })),
});

export const tenantIdParams = t.Object({ id: t.String() });
