import { t } from "elysia";

export const roleIdParams = t.Object({ id: t.String({ format: "uuid" }) });

export const createRoleBody = t.Object({
  name: t.String({ minLength: 2, maxLength: 80 }),
  description: t.Optional(t.String({ maxLength: 500 })),
  scope: t.Union([t.Literal("TENANT"), t.Literal("BRANCH")]),
});

export const updateRoleBody = t.Object({
  name: t.Optional(t.String({ minLength: 2, maxLength: 80 })),
  description: t.Optional(t.String({ maxLength: 500 })),
});
