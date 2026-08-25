import { and, eq } from "drizzle-orm";
import { db } from "../../db";
import {
  branches,
  membershipRoles,
  roles,
  tenantMemberships,
  tenants,
} from "../../db/schema";

export const tenantRepository = {
  async findMembershipsByUserId(userId: string) {
    return db.query.tenantMemberships.findMany({
      where: eq(tenantMemberships.userId, userId),
      with: {
        tenant: true,
        roles: { with: { role: true } },
        branches: true,
      },
      orderBy: (membership, { asc }) => asc(membership.createdAt),
    });
  },

  async findById(id: string) {
    return db.query.tenants.findFirst({ where: eq(tenants.id, id) });
  },

  async create(data: { name: string; createdBy: string }) {
    const [tenant] = await db.insert(tenants).values(data).returning();
    return tenant!;
  },

  async update(id: string, changes: { name?: string; isActive?: boolean }) {
    const [tenant] = await db
      .update(tenants)
      .set({ ...changes, updatedAt: new Date() })
      .where(eq(tenants.id, id))
      .returning();
    return tenant;
  },

  async createOwnerMembership(
    userId: string,
    tenantId: string,
    roleId: string,
  ) {
    return db.transaction(async (tx) => {
      const [membership] = await tx
        .insert(tenantMemberships)
        .values({ userId, tenantId })
        .returning();
      if (!membership) throw new Error("Tenant membership creation failed");

      await tx
        .insert(membershipRoles)
        .values({ membershipId: membership.id, roleId });
      return membership;
    });
  },

  async findRoleByName(name: string) {
    return db.query.roles.findFirst({ where: eq(roles.name, name as any) });
  },

  async branchBelongsToTenant(tenantId: string, branchId: string) {
    return db.query.branches.findFirst({
      where: and(eq(branches.id, branchId), eq(branches.tenantId, tenantId)),
      columns: { id: true },
    });
  },
};
