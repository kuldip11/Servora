import { t } from "elysia";

export const signupBody = t.Object({
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

export const profileBody = t.Object({
  firstName: t.Optional(t.String({ minLength: 1, maxLength: 50 })),
  lastName: t.Optional(t.String({ minLength: 1, maxLength: 50 })),
});

export const sessionIdParams = t.Object({ id: t.String({ format: "uuid" }) });
