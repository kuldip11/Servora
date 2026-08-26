import { t } from "elysia";

export const signupBody = t.Object({
  // Deprecated compatibility field. Signup no longer creates a tenant.
  tenantName: t.Optional(t.String({ minLength: 2 })),
  firstName: t.String({ minLength: 1 }),
  lastName: t.String({ minLength: 1 }),
  email: t.String({ format: "email" }),
  password: t.String({ minLength: 8 }),
});

export const loginBody = t.Object({
  email: t.String({ format: "email" }),
  password: t.String({ minLength: 1 }),
});

export const refreshBody = t.Object({
  refreshToken: t.String({ minLength: 1 }),
});
