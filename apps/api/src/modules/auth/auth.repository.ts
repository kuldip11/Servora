/**
 * Auth repository — data access only. Password hashing, token issuing,
 * and business rules live in `auth.service.ts`.
 */
import { eq, and, isNull, gt } from 'drizzle-orm';
import { db } from '../../db';
import {
  users,
  roles,
  globalUserRoles,
  refreshTokens,
  permissions,
  rolePermissions,
  branches,
  tenantMemberships,
} from '../../db/schema';

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const authRepository = {
  async createBranch(data: { tenantId: string; name: string; address: string }) {
    const [branch] = await db.insert(branches).values(data).returning();
    return branch!;
  },

  async createUser(data: {
    firstName: string;
    lastName: string;
    email: string;
    passwordHash: string;
  }) {
    const [user] = await db.insert(users).values({ ...data, email: normalizeEmail(data.email) }).returning();
    return user!;
  },

  async findStandaloneUserByEmail(email: string) {
    return db.query.users.findFirst({
      where: and(eq(users.email, normalizeEmail(email)), isNull(users.deletedAt)),
      with: {
        globalUserRoles: {
          with: {
            role: {
              with: { rolePermissions: { with: { permission: true } } },
            },
          },
        },
      },
    });
  },

  async findUsersByEmail(email: string) {
    return db.query.users.findMany({
      where: and(eq(users.email, normalizeEmail(email)), isNull(users.deletedAt)),
      with: {
        globalUserRoles: {
          with: {
            role: {
              with: {
                rolePermissions: { with: { permission: true } },
              },
            },
          },
        },
      },
    });
  },

  async findUserByEmail(email: string) {
    return db.query.users.findFirst({
      where: and(eq(users.email, normalizeEmail(email)), isNull(users.deletedAt)),
      with: {
        globalUserRoles: {
          with: {
            role: {
              with: {
                rolePermissions: { with: { permission: true } },
              },
            },
          },
        },
      },
    });
  },

  async findMembershipById(membershipId: string) {
    return db.query.tenantMemberships.findFirst({
      where: eq(tenantMemberships.id, membershipId),
      with: {
        roles: { with: { role: { with: { rolePermissions: { with: { permission: true } } } } } },
        branches: true,
      },
    });
  },

  async findMembershipByUserAndTenant(userId: string, tenantId: string) {
    return db.query.tenantMemberships.findFirst({
      where: and(
        eq(tenantMemberships.userId, userId),
        eq(tenantMemberships.tenantId, tenantId),
      ),
      with: {
        roles: {
          with: {
            role: {
              with: {
                rolePermissions: { with: { permission: true } },
              },
            },
          },
        },
        branches: true,
      },
    });
  },

  async findUserById(id: string) {
    return db.query.users.findFirst({
      where: and(eq(users.id, id), isNull(users.deletedAt)),
      with: {
        globalUserRoles: {
          with: {
            role: {
              with: {
                rolePermissions: { with: { permission: true } },
              },
            },
          },
        },
      },
    });
  },

  async createUserWithGlobalOwnerRole(data: {
    firstName: string;
    lastName: string;
    email: string;
    passwordHash: string;
  }) {
    return db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({ ...data, email: normalizeEmail(data.email) })
        .returning();
      if (!user) throw new Error('User creation failed');

      const [role] = await tx
        .insert(roles)
        .values({ name: 'OWNER', scope: 'GLOBAL', description: 'Global owner access' })
        .onConflictDoUpdate({
          target: roles.name,
          set: { scope: 'GLOBAL', description: 'Global owner access' },
        })
        .returning();
      if (!role) throw new Error('Unable to provision GLOBAL OWNER role');

      const allPermissions = await tx.select({ id: permissions.id }).from(permissions);
      if (!allPermissions.length) {
        throw new Error('RBAC reference data is not installed: permissions are missing');
      }

      await tx
        .insert(rolePermissions)
        .values(allPermissions.map((permission) => ({ roleId: role.id, permissionId: permission.id })))
        .onConflictDoNothing();

      await tx
        .insert(globalUserRoles)
        .values({ userId: user.id, roleId: role.id })
        .onConflictDoNothing();

      return { user, role };
    });
  },

  async ensureGlobalOwnerRole() {
    return db.transaction(async (tx) => {
      const [role] = await tx
        .insert(roles)
        .values({ name: 'OWNER', scope: 'GLOBAL', description: 'Global owner access' })
        .onConflictDoUpdate({
          target: roles.name,
          set: { scope: 'GLOBAL', description: 'Global owner access' },
        })
        .returning();
      if (!role) throw new Error('Unable to provision GLOBAL OWNER role');

      const allPermissions = await tx.select({ id: permissions.id }).from(permissions);
      if (!allPermissions.length) {
        throw new Error('RBAC reference data is not installed: permissions are missing');
      }
      await tx
        .insert(rolePermissions)
        .values(allPermissions.map((permission) => ({ roleId: role.id, permissionId: permission.id })))
        .onConflictDoNothing();
      return role;
    });
  },

  async findRoleByName(name: string) {
    return db.query.roles.findFirst({ where: eq(roles.name, name as any) });
  },

  async assignRole(userId: string, roleId: string) {
    await db
      .insert(globalUserRoles)
      .values({ userId, roleId })
      .onConflictDoNothing();
  },

  async saveRefreshToken(data: { userId: string; membershipId?: string; tokenHash: string; expiresAt: Date }) {
    const [token] = await db.insert(refreshTokens).values(data).returning();
    return token!;
  },

  async consumeRefreshToken(tokenHash: string) {
    const [token] = await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(refreshTokens.tokenHash, tokenHash),
          isNull(refreshTokens.revokedAt),
          gt(refreshTokens.expiresAt, new Date()),
        ),
      )
      .returning();
    return token;
  },

};
