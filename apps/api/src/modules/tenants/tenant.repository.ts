import { and, eq, isNull } from "drizzle-orm";
import { db } from "../../db";
import {
  branches,
  membershipRoles,
  roles,
  tenantMemberships,
  tenants,
  organizationMemberships,
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


  async findOrganizationMembership(userId: string, organizationId: string) {
    return db.query.organizationMemberships.findFirst({
      where: and(
        eq(organizationMemberships.userId, userId),
        eq(organizationMemberships.organizationId, organizationId),
        eq(organizationMemberships.status, "ACTIVE"),
      ),
      with: { organization: true },
    });
  },

  async findById(id: string) {
    return db.query.tenants.findFirst({ where: eq(tenants.id, id) });
  },

  async create(data: { name: string; createdBy: string; organizationId: string }) {
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
    return db.query.roles.findFirst({
      where: and(eq(roles.name, name as any), isNull(roles.tenantId), eq(roles.isSystem, true)),
    });
  },

  async branchBelongsToTenant(tenantId: string, branchId: string) {
    return db.query.branches.findFirst({
      where: and(eq(branches.id, branchId), eq(branches.tenantId, tenantId)),
      columns: { id: true },
    });
  },
};
