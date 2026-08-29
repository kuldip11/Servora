import { t } from "elysia";

export const rolePermissionParams = t.Object({
  id: t.String({ format: "uuid" }),
});
export const setRolePermissionsBody = t.Object({
  permissionIds: t.Array(t.String({ format: "uuid" }), { uniqueItems: true }),
});
