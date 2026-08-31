import { and, eq, inArray } from "drizzle-orm";

import {
  membershipBranches,
  membershipRoles,
  globalUserRoles,
  permissions,
  rolePermissions,
  roles,
  tenantMemberships,
  branches,
} from "../../db/schema";
import { ForbiddenError } from "../errors";
import type { Database } from "../../db";

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
  db: Database,
  userId: string,
  tenantId: string,
) {

  if (!tenantId) return undefined;

  return db.query.tenantMemberships.findFirst({
    where: and(
      eq(tenantMemberships.userId, userId),
      eq(tenantMemberships.tenantId, tenantId),
      eq(tenantMemberships.status, "ACTIVE"),
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
  db: Database,
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
      ...membership.roles.map((item) => item.roleId),
      ...globalRoles.map((item) => item.roleId),
    ]),
  ];
  const tenantWide =
    membership.roles.some(
      (item) =>
        item.role?.scope === "GLOBAL" || item.role?.scope === "TENANT",
    ) || globalRoles.some((item) => item.role?.scope === "GLOBAL");
  const branchIds = membership.branches.map((item) => item.branchId);

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

  const permissionKeys = new Set<string>(
    rows.map((row) => row.key),
  );
  for (const globalRole of globalRoles) {
    for (const rolePermission of globalRole.role?.rolePermissions ?? []) {
      if (rolePermission.permission?.key)
        permissionKeys.add(rolePermission.permission.key);
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
  db: Database,
  context: AuthorizationContext,
  permissionKey: string,
) {
  const decision = await resolveAuthorization(db, context);
  return decision.allowed && decision.permissionKeys.includes(permissionKey);
}

export async function requirePermission(
  db: Database,
  context: AuthorizationContext,
  permissionKey: string,
) {
  const decision = await resolveAuthorization(db, context);

  if (!decision.allowed) {
    throw new ForbiddenError("Permission denied");
  }

  if (!decision.permissionKeys.includes(permissionKey)) {
    throw new ForbiddenError(`Missing required permission: ${permissionKey}`);
  }

  return decision;
}

export async function requireBranchAccess(
  db: Database,
  context: AuthorizationContext,
  branchId: string,
) {
  const decision = await resolveAuthorization(db, {
    ...context,
    branchId,
  });

  if (!decision.allowed) {
    throw new ForbiddenError("Branch access denied");
  }

  return decision;
}
