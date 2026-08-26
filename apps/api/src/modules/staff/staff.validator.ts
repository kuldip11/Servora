import { t } from "elysia";

export const createStaffBody = t.Object({
  firstName: t.String({ minLength: 1 }),
  lastName: t.String({ minLength: 1 }),
  email: t.String({ format: "email" }),
  password: t.String({ minLength: 8 }),
  roleId: t.String(),
  branchIds: t.Optional(t.Array(t.String())),
});

export const updateStaffBody = t.Object({
  firstName: t.Optional(t.String()),
  lastName: t.Optional(t.String()),
  status: t.Optional(
    t.Union([
      t.Literal("ACTIVE"),
      t.Literal("INACTIVE"),
      t.Literal("SUSPENDED"),
    ]),
  ),
  roleId: t.Optional(t.String()),
  branchIds: t.Optional(t.Array(t.String())),
});

export const staffIdParams = t.Object({ id: t.String() });
