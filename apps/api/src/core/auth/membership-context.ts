import { and, eq } from "drizzle-orm";
import { ForbiddenError } from "../errors";
import type { Database } from "../../db";

import type { AvailableMembership } from "@pos/types";
import {
  branches,
  tenantMemberships,
  users,
  globalUserRoles,
} from "../../db/schema";
import { type ActiveAuthContext } from "./membership-session";
import { resolveMembership } from "./authorization";

export async function listUserMemberships(
  db: Database,
  userId: string,
): Promise<AvailableMembership[]> {
  const [memberships, user] = await Promise.all([
    db.query.tenantMemberships.findMany({
      where: and(
        eq(tenantMemberships.userId, userId),
        eq(tenantMemberships.status, "ACTIVE"),
      ),
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
    user?.globalUserRoles?.some(
      (item) =>
        item.role?.name === "OWNER" && item.role?.scope === "GLOBAL",
    ),
  );

  return Promise.all(
    memberships.map(async (membership) => {
      const tenantWide = membership.roles.some(
        (item) =>
          item.role?.scope === "GLOBAL" || item.role?.scope === "TENANT",
      );
      const branchRecords = tenantWide
        ? await db.query.branches.findMany({
            where: and(
              eq(branches.tenantId, membership.tenantId),
              eq(branches.isActive, true),
            ),
          })
        : membership.branches.map((item) => item.branch).filter(Boolean);

      return {
        membershipId: membership.id,
        isGlobalOwner,
        tenant: membership.tenant
          ? { id: membership.tenant.id, name: membership.tenant.name }
          : { id: membership.tenantId, name: "" },
        roles: membership.roles.map((item) => ({
          id: item.roleId,
          name: item.role?.name ?? item.roleId,
          scope: item.role?.scope ?? "BRANCH",
        })),
        branches: branchRecords.map((branch) => ({
          id: branch.id,
          name: branch.name,
          address: branch.address,
          isActive: branch.isActive,
          tablesEnabled: branch.tablesEnabled,
        })),
      };
    }),
  );
}

export async function resolveActiveBranch(
  db: Database,
  context: ActiveAuthContext,
  branchId: string,
): Promise<ActiveAuthContext> {
  const membership = await resolveMembership(
    db,
    context.userId,
    context.tenantId,
  );

  if (!membership || membership.id !== context.membershipId) {
    throw new ForbiddenError("Membership access denied");
  }

  const branch = await db.query.branches.findFirst({
    where: and(
      eq(branches.id, branchId),
      eq(branches.tenantId, context.tenantId),
    ),
    columns: { id: true, tenantId: true },
  });

  if (!branch || branch.tenantId !== context.tenantId) {
    throw new ForbiddenError("Membership access denied");
  }

  const globalRoles = await db.query.globalUserRoles.findMany({
    where: eq(globalUserRoles.userId, context.userId),
    with: { role: true },
  });
  const tenantWide =
    membership.roles.some(
      (item) =>
        item.role?.scope === "GLOBAL" || item.role?.scope === "TENANT",
    ) || globalRoles.some((item) => item.role?.scope === "GLOBAL");

  if (!tenantWide) {
    const assigned = membership.branches.some(
      (item) => item.branchId === branchId,
    );

    if (!assigned) {
      throw new ForbiddenError("Membership access denied");
    }
  }

  return {
    ...context,
    branchId,
  };
}
