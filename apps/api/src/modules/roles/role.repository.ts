import { and, eq, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { membershipRoles, roles } from "@/db/schema";

export const roleRepository = {
  listForTenant(tenantId: string) {
    return db.query.roles.findMany({
      where: and(
        eq(roles.isActive, true),
        or(isNull(roles.tenantId), eq(roles.tenantId, tenantId)),
      ),
      orderBy: (r, { asc }) => [asc(r.scope), asc(r.name)],
    });
  },

  findTenantRole(tenantId: string, id: string) {
    return db.query.roles.findFirst({
      where: and(eq(roles.id, id), eq(roles.tenantId, tenantId)),
    });
  },

  findByNameAndScope(
    tenantId: string,
    name: string,
    scope: "TENANT" | "BRANCH",
  ) {
    return db.query.roles.findFirst({
      where: and(
        eq(roles.tenantId, tenantId),
        eq(roles.scope, scope),
        sql`lower(${roles.name}) = lower(${name.trim()})`,
      ),
    });
  },

  async create(
    tenantId: string,
    input: { name: string; description?: string; scope: "TENANT" | "BRANCH" },
  ) {
    const [created] = await db
      .insert(roles)
      .values({
        tenantId,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        scope: input.scope,
        isSystem: false,
      })
      .returning();
    return created!;
  },

  async update(id: string, input: { name?: string; description?: string }) {
    const values: Record<string, unknown> = { updatedAt: new Date() };
    if (input.name !== undefined) values.name = input.name.trim();
    if (input.description !== undefined)
      values.description = input.description.trim() || null;
    const [updated] = await db
      .update(roles)
      .set(values)
      .where(eq(roles.id, id))
      .returning();
    return updated;
  },

  async assignmentCount(roleId: string) {
    const rows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(membershipRoles)
      .where(eq(membershipRoles.roleId, roleId));
    return rows[0]?.count ?? 0;
  },

  async archive(id: string) {
    const [updated] = await db
      .update(roles)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(roles.id, id))
      .returning();
    return updated;
  },
};
