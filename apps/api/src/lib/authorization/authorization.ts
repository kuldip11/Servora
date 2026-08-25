import { and, eq, inArray } from 'drizzle-orm';

import {
  membershipBranches,
  membershipRoles,
  globalUserRoles,
  permissions,
  rolePermissions,
  roles,
  tenantMemberships,
  branches,
} from '../../db/schema';

/**
 * Membership-based authorization foundation.
 *
 * This module is deliberately additive during migration:
 * existing auth/RBAC callers can continue to work until each API module is
 * migrated. The server remains authoritative; tenant/branch identifiers from
 * requests are only context selectors and are never treated as proof of access.
 */

export type AuthorizationContext = {
  userId: string;
  tenantId: string;
  branchId?: string | null;
};

export type AuthorizationDecision = {
  allowed: boolean;
  membershipId?: string;
  roleIds: string[];
  permissionKeys: string[];
  branchIds: string[];
  tenantWide: boolean;
};

export async function resolveMembership(
  db: any,
  userId: string,
  tenantId: string,
) {
  // A newly registered identity legitimately has no tenant yet. Never pass
  // the empty compatibility tenantId to PostgreSQL UUID comparisons.
  if (!tenantId) return undefined;

  return db.query.tenantMemberships.findFirst({
    where: and(
      eq(tenantMemberships.userId, userId),
      eq(tenantMemberships.tenantId, tenantId),
      eq(tenantMemberships.status, 'ACTIVE'),
    ),
    with: {
      roles: {
        with: {
          role: true,
        },
      },
      branches: true,
    },
  });
}

export async function resolveAuthorization(
  db: any,
  context: AuthorizationContext,
): Promise<AuthorizationDecision> {
  const membership = await resolveMembership(
    db,
    context.userId,
    context.tenantId,
  );

  if (!membership) {
    return {
      allowed: false,
      roleIds: [],
      permissionKeys: [],
      branchIds: [],
      tenantWide: false,
    };
  }

  const globalRoles = await db.query.globalUserRoles.findMany({
    where: eq(globalUserRoles.userId, context.userId),
    with: {
      role: { with: { rolePermissions: { with: { permission: true } } } },
    },
  });

  const roleIds = [
    ...new Set([
      ...membership.roles.map((item: any) => item.roleId),
      ...globalRoles.map((item: any) => item.roleId),
    ]),
  ];
  const tenantWide = membership.roles.some((item: any) => item.role?.scope === 'GLOBAL' || item.role?.scope === 'TENANT')
    || globalRoles.some((item: any) => item.role?.scope === 'GLOBAL');
  const branchIds = membership.branches.map((item: any) => item.branchId);

  if (context.branchId) {
    const branch = await db.query.branches.findFirst({
      where: and(
        eq(branches.id, context.branchId),
        eq(branches.tenantId, context.tenantId),
      ),
      columns: { id: true },
    });

    if (!branch || (!tenantWide && !branchIds.includes(context.branchId))) {
      return {
        allowed: false,
        membershipId: membership.id,
        roleIds,
        permissionKeys: [],
        branchIds,
        tenantWide,
      };
    }
  }

  if (roleIds.length === 0) {
    return {
      allowed: false,
      membershipId: membership.id,
      roleIds,
      permissionKeys: [],
      branchIds,
      tenantWide: false,
    };
  }

  const rows = await db
    .select({ key: permissions.key })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(inArray(rolePermissions.roleId, roleIds));

  const permissionKeys = new Set<string>(rows.map((row: any) => row.key as string));
  for (const globalRole of globalRoles) {
    for (const rolePermission of globalRole.role?.rolePermissions ?? []) {
      if (rolePermission.permission?.key) permissionKeys.add(rolePermission.permission.key);
    }
  }

  const resolvedPermissionKeys: string[] = [...permissionKeys];

  return {
    allowed: true,
    membershipId: membership.id,
    roleIds,
    permissionKeys: resolvedPermissionKeys,
    branchIds,
    tenantWide,
  };
}

export async function hasPermission(
  db: any,
  context: AuthorizationContext,
  permissionKey: string,
) {
  const decision = await resolveAuthorization(db, context);
  return decision.allowed && decision.permissionKeys.includes(permissionKey);
}

export async function requirePermission(
  db: any,
  context: AuthorizationContext,
  permissionKey: string,
) {
  const decision = await resolveAuthorization(db, context);

  if (!decision.allowed) {
    throw new Error('FORBIDDEN');
  }

  if (!decision.permissionKeys.includes(permissionKey)) {
    throw new Error('FORBIDDEN');
  }

  return decision;
}

export async function requireBranchAccess(
  db: any,
  context: AuthorizationContext,
  branchId: string,
) {
  const decision = await resolveAuthorization(db, {
    ...context,
    branchId,
  });

  if (!decision.allowed) {
    throw new Error('FORBIDDEN');
  }

  return decision;
}
