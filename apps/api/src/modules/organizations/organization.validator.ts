import { t } from "elysia";

export const createOrganizationBody = t.Object({
  name: t.String({ minLength: 1, maxLength: 200 }),
});

export const updateOrganizationBody = t.Object({
  name: t.Optional(t.String({ minLength: 1, maxLength: 200 })),
});

export const organizationIdParams = t.Object({ id: t.String() });
