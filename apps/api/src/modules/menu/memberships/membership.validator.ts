import { t } from "elysia";
export const membershipBody = t.Object({
  menuId: t.String(),
  categoryId: t.String(),
  sortOrder: t.Optional(t.Integer()),
});
export const itemMembershipParams = t.Object({ id: t.String() });
export const membershipParams = t.Object({
  id: t.String(),
  menuId: t.String(),
});
export const menuItemsParams = t.Object({ id: t.String() });
