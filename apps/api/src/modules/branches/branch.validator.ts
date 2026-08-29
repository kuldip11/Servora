import { t } from "elysia";

export const createBranchBody = t.Object({
  name: t.String({ minLength: 1, maxLength: 200 }),
  code: t.String({ minLength: 2, maxLength: 24, pattern: "^[A-Za-z0-9-]+$" }),
  timezone: t.String({ minLength: 1, maxLength: 64 }),
  currency: t.String({ minLength: 3, maxLength: 3, pattern: "^[A-Za-z]{3}$" }),
  address: t.Optional(t.String()),
  phone: t.Optional(t.String()),
  dineInEnabled: t.Optional(t.Boolean()),
  takeawayEnabled: t.Optional(t.Boolean()),
  deliveryEnabled: t.Optional(t.Boolean()),
  onlineEnabled: t.Optional(t.Boolean()),
  tablesEnabled: t.Optional(t.Boolean()),
});

export const updateBranchBody = t.Object({
  name: t.Optional(t.String({ minLength: 1, maxLength: 200 })),
  code: t.Optional(
    t.String({ minLength: 2, maxLength: 24, pattern: "^[A-Za-z0-9-]+$" }),
  ),
  timezone: t.Optional(t.String({ minLength: 1, maxLength: 64 })),
  currency: t.Optional(
    t.String({ minLength: 3, maxLength: 3, pattern: "^[A-Za-z]{3}$" }),
  ),
  address: t.Optional(t.String()),
  phone: t.Optional(t.String()),
  dineInEnabled: t.Optional(t.Boolean()),
  takeawayEnabled: t.Optional(t.Boolean()),
  deliveryEnabled: t.Optional(t.Boolean()),
  onlineEnabled: t.Optional(t.Boolean()),
  tablesEnabled: t.Optional(t.Boolean()),
});

export const branchIdParams = t.Object({
  id: t.String(),
});
