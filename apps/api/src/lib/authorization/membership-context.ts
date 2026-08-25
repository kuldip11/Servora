import { and, eq } from 'drizzle-orm';
import { ForbiddenError } from '../../core/errors';

import type { AvailableMembership } from '@pos/types';
import { branches, tenantMemberships, users, globalUserRoles } from '../../db/schema';
import { type ActiveAuthContext } from './auth-context';
import { resolveMembership } from './authorization';

export async function listUserMemberships(
  db: any,
  userId: string,
): Promise<AvailableMembership[]> {
  const [memberships, user] = await Promise.all([
    db.query.tenantMemberships.findMany({
      where: and(eq(tenantMemberships.userId, userId), eq(tenantMemberships.status, 'ACTIVE')),
      with: {
        tenant: true,
        roles: {
          with: {
            role: true,
          },
        },
        branches: { with: { branch: true } },
      },
    }),
    db.query.users.findFirst({
      where: eq(users.id, userId),
      with: {
        globalUserRoles: { with: { role: true } },
      },
    }),
  ]);

  const isGlobalOwner = Boolean(
    user?.globalUserRoles?.some((item: any) => item.role?.name === 'OWNER' && item.role?.scope === 'GLOBAL'),
  );

  return memberships.map((membership: any) => ({
    membershipId: membership.id,
    isGlobalOwner,
    tenant: membership.tenant
      ? { id: membership.tenant.id, name: membership.tenant.name }
      : { id: membership.tenantId, name: '' },
    roles: membership.roles.map((item: any) => ({
      id: item.roleId,
      name: item.role?.name ?? item.roleId,
      scope: item.role?.scope ?? 'BRANCH',
    })),
    branches: membership.branches
      .map((item: any) => item.branch)
      .filter(Boolean)
      .map((branch: any) => ({
        id: branch.id,
        name: branch.name,
        address: branch.address,
        isActive: branch.isActive,
        tablesEnabled: branch.tablesEnabled,
      })),
  }));
}

/**
 * Resolves a requested active tenant/membership.
 *
 * A caller may request a membership by ID, but the server verifies that the
 * membership belongs to the authenticated user before activating it.
 */
export async function resolveActiveBranch(
  db: any,
  context: ActiveAuthContext,
  branchId: string,
): Promise<ActiveAuthContext> {
  const membership = await resolveMembership(db, context.userId, context.tenantId);

  if (!membership || membership.id !== context.membershipId) {
    throw new ForbiddenError('Membership access denied');
  }

  const branch = await db.query.branches.findFirst({
    where: and(eq(branches.id, branchId), eq(branches.tenantId, context.tenantId)),
    columns: { id: true, tenantId: true },
  });

  // Defense in depth: don't rely solely on the query's `where` clause to
  // enforce tenant isolation — explicitly reject a branch record that
  // doesn't belong to the active tenant even if one was returned.
  if (!branch || branch.tenantId !== context.tenantId) {
    throw new ForbiddenError('Membership access denied');
  }

  const globalRoles = await db.query.globalUserRoles.findMany({
    where: eq(globalUserRoles.userId, context.userId),
    with: { role: true },
  });
  const tenantWide = membership.roles.some(
    (item: any) => item.role?.scope === 'GLOBAL' || item.role?.scope === 'TENANT',
  ) || globalRoles.some((item: any) => item.role?.scope === 'GLOBAL');

  if (!tenantWide) {
    const assigned = membership.branches.some(
      (item: any) => item.branchId === branchId,
    );

    if (!assigned) {
      throw new ForbiddenError('Membership access denied');
    }
  }

  return {
    ...context,
    branchId,
  };
}
