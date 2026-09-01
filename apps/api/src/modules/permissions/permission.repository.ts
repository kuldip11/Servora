import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { permissions, rolePermissions, roles } from "@/db/schema";

export const permissionRepository = {
  list() {
    return db.query.permissions.findMany({
      orderBy: (p, { asc }) => [asc(p.module), asc(p.key)],
    });
  },
  findRole(tenantId: string, roleId: string) {
    return db.query.roles.findFirst({
      where: and(
        eq(roles.id, roleId),
        eq(roles.tenantId, tenantId),
        eq(roles.isActive, true),
      ),
      with: { rolePermissions: { with: { permission: true } } },
    });
  },
  async findPermissionsByIds(ids: string[]) {
    if (!ids.length) return [];
    return db.query.permissions.findMany({
      where: inArray(permissions.id, ids),
    });
  },
  async replaceRolePermissions(roleId: string, permissionIds: string[]) {
    await db.transaction(async (tx) => {
      await tx
        .delete(rolePermissions)
        .where(eq(rolePermissions.roleId, roleId));
      if (permissionIds.length) {
        await tx
          .insert(rolePermissions)
          .values(
            permissionIds.map((permissionId) => ({ roleId, permissionId })),
          );
      }
    });
  },
};
