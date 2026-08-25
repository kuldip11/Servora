import { and, eq, inArray, isNull } from 'drizzle-orm';
import { db } from '../../db';
import {
  branches,
  membershipBranches,
  membershipRoles,
  roles,
  tenantMemberships,
  users,
} from '../../db/schema';

const STAFF_LIST_COLUMNS = { passwordHash: false } as const;

export const staffRepository = {
  async findMany(tenantId: string, branchId: string | null, authorizedBranchIds?: string[]) {
    const memberships = await db.query.tenantMemberships.findMany({
      where: and(eq(tenantMemberships.tenantId, tenantId), eq(tenantMemberships.status, 'ACTIVE')),
      with: {
        user: { columns: STAFF_LIST_COLUMNS },
        roles: { with: { role: true } },
        branches: { with: { branch: true } },
      },
    });

    const scoped = authorizedBranchIds
      ? (branchId
        ? memberships.filter((membership: any) => membership.branches.some((item: any) => item.branchId === branchId))
        : memberships.filter((membership: any) => membership.branches.some((item: any) => authorizedBranchIds.includes(item.branchId))))
      : memberships;

    return scoped
      .filter((membership: any) => membership.user && !membership.user.deletedAt)
      .map((membership: any) => ({
        ...membership.user,
        membershipId: membership.id,
        roles: membership.roles.map((item: any) => item.role),
        assignedBranches: membership.branches.map((item: any) => item.branch).filter(Boolean),
      }));
  },

  async findMembership(tenantId: string, userId: string) {
    return db.query.tenantMemberships.findFirst({
      where: and(
        eq(tenantMemberships.tenantId, tenantId),
        eq(tenantMemberships.userId, userId),
      ),
      with: {
        user: { columns: STAFF_LIST_COLUMNS },
        roles: { with: { role: true } },
        branches: { with: { branch: true } },
      },
    });
  },

  async findRoleById(roleId: string) {
    return db.query.roles.findFirst({ where: eq(roles.id, roleId) });
  },

  async findBranchesByIds(tenantId: string, branchIds: string[]) {
    if (branchIds.length === 0) return [];
    return db.query.branches.findMany({
      where: and(eq(branches.tenantId, tenantId), inArray(branches.id, branchIds)),
      columns: { id: true, isActive: true },
    });
  },

  async create(data: {
    tenantId: string;
    branchId?: string;
    firstName: string;
    lastName: string;
    email: string;
    passwordHash: string;
    roleId: string;
    branchIds: string[];
  }) {
    return db.transaction(async (tx) => {
      let user = await tx.query.users.findFirst({
        where: and(eq(users.email, data.email), isNull(users.deletedAt)),
      });

      if (!user) {
        const [created] = await tx.insert(users).values({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          passwordHash: data.passwordHash,
        }).returning();
        user = created;
      }
      if (!user) throw new Error('Staff creation failed');

      const existingMembership = await tx.query.tenantMemberships.findFirst({
        where: and(eq(tenantMemberships.userId, user.id), eq(tenantMemberships.tenantId, data.tenantId)),
      });
      if (existingMembership) throw new Error('User already belongs to this tenant');

      const [membership] = await tx.insert(tenantMemberships).values({
        userId: user.id,
        tenantId: data.tenantId,
      }).returning();
      if (!membership) throw new Error('Staff membership creation failed');

      await tx.insert(membershipRoles).values({ membershipId: membership.id, roleId: data.roleId });
      if (data.branchIds.length) {
        await tx.insert(membershipBranches).values(
          data.branchIds.map((branchId) => ({ membershipId: membership.id, tenantId: data.tenantId, branchId })),
        );
      }

      return membership;
    });
  },

  async updateUser(tenantId: string, userId: string, data: {
    firstName?: string;
    lastName?: string;
  }) {
    const [updated] = await db.update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .returning();
    return updated;
  },

  async updateMembershipStatus(tenantId: string, userId: string, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') {
    const [updated] = await db.update(tenantMemberships)
      .set({ status, updatedAt: new Date() })
      .where(and(
        eq(tenantMemberships.tenantId, tenantId),
        eq(tenantMemberships.userId, userId),
      ))
      .returning();
    return updated;
  },

  async setRole(membershipId: string, roleId: string) {
    return db.transaction(async (tx) => {
      await tx.delete(membershipRoles).where(eq(membershipRoles.membershipId, membershipId));
      await tx.insert(membershipRoles).values({ membershipId, roleId });
    });
  },

  async setBranches(membershipId: string, branchIds: string[]) {
    return db.transaction(async (tx) => {
      const membership = await tx.query.tenantMemberships.findFirst({
        where: eq(tenantMemberships.id, membershipId),
        columns: { tenantId: true },
      });
      if (!membership) throw new Error('Membership not found');
      await tx.delete(membershipBranches).where(eq(membershipBranches.membershipId, membershipId));
      if (branchIds.length) {
        await tx.insert(membershipBranches).values(
          branchIds.map((branchId) => ({ membershipId, tenantId: membership.tenantId, branchId })),
        );
      }
    });
  },

  async softDelete(tenantId: string, id: string) {
    return this.updateMembershipStatus(tenantId, id, 'INACTIVE');
  },

  async findAllRoles() {
    return db.query.roles.findMany();
  },
};
