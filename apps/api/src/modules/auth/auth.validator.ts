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

export const profileBody = t.Object({
  firstName: t.Optional(t.String({ minLength: 1, maxLength: 50 })),
  lastName: t.Optional(t.String({ minLength: 1, maxLength: 50 })),
  displayName: t.Optional(t.Union([t.String({ maxLength: 150 }), t.Null()])),
  phone: t.Optional(t.Union([t.String({ maxLength: 30 }), t.Null()])),
  profileImageUrl: t.Optional(
    t.Union([t.String({ format: "uri", maxLength: 1000 }), t.Null()]),
  ),
});

export const changePasswordBody = t.Object({
  currentPassword: t.String({ minLength: 1, maxLength: 100 }),
  newPassword: t.String({ minLength: 8, maxLength: 100 }),
});

export const sessionIdParams = t.Object({ id: t.String({ format: "uuid" }) });
