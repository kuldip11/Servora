import type { AuthContext } from "../../core/auth";
import { requirePermission } from "../../core/auth";
import { tenantRepository } from "./tenant.repository";
import { branchRepository } from "../branches/branch.repository";
import { tenantNotFound } from "./tenant.errors";
import { ForbiddenError } from "../../core/errors";
import { writeAudit } from "../../core/audit";

export const tenantService = {
  async list(auth: AuthContext) {
    // Franchise selection is a context operation. Any authenticated user may
    // list the franchises they are already authorized to access.
    const memberships = await tenantRepository.findMembershipsByUserId(
      auth.userId,
    );
    return Promise.all(
      memberships.map(async (membership) => {
        const tenantWide = membership.roles.some(
          (item: any) => item.role.scope === "TENANT",
        );
        const branchIds = tenantWide
          ? (await branchRepository.findMany(membership.tenant.id, null)).map(
              (branch) => branch.id,
            )
          : membership.branches.map((item) => item.branchId);

        return {
          membershipId: membership.id,
          tenant: membership.tenant,
          roles: membership.roles.map((item: any) => ({
            id: item.roleId,
            name: item.role.name,
            scope: item.role.scope,
          })),
          branchIds,
        };
      }),
    );
  },

  async create(auth: AuthContext, input: { name: string }) {
    // Creating a new franchise is an ownership operation, not a generic
    // tenant permission. Only the global OWNER can create another franchise.
    if (!auth.roles.includes("OWNER")) {
      throw new ForbiddenError("Only the global Owner can create tenants");
    }
    const tenant = await tenantRepository.create({
      name: input.name,
      createdBy: auth.userId,
    });
    const tenantRole = await tenantRepository.findRoleByName("FRANCHISE_ADMIN");
    if (!tenantRole || tenantRole.scope !== "TENANT")
      throw new Error(
        "RBAC reference data is not installed: TENANT FRANCHISE_ADMIN role is missing",
      );
    const membership = await tenantRepository.createOwnerMembership(
      auth.userId,
      tenant.id,
      tenantRole.id,
    );
    await writeAudit({
      tenantId: tenant.id,
      userId: auth.userId,
      action: "TENANT_CREATED",
      entity: "tenant",
      entityId: tenant.id,
      metadata: { name: tenant.name },
    });
    return { tenant, membershipId: membership.id };
  },

  async update(
    auth: AuthContext,
    tenantId: string,
    changes: { name?: string },
  ) {
    requirePermission(auth, "tenant:update");
    if (!auth.roles.includes("OWNER") && tenantId !== auth.tenantId)
      throw tenantNotFound(tenantId);
    const updated = await tenantRepository.update(tenantId, changes);
    if (!updated) throw tenantNotFound(tenantId);
    await writeAudit({
      tenantId,
      userId: auth.userId,
      action: "TENANT_UPDATED",
      entity: "tenant",
      entityId: tenantId,
      metadata: { changes },
    });
    return updated;
  },

  async archive(auth: AuthContext, tenantId: string) {
    requirePermission(auth, "tenant:archive");
    if (!auth.roles.includes("OWNER") && tenantId !== auth.tenantId)
      throw tenantNotFound(tenantId);
    const updated = await tenantRepository.update(tenantId, {
      isActive: false,
    });
    if (!updated) throw tenantNotFound(tenantId);
    await writeAudit({
      tenantId,
      userId: auth.userId,
      action: "TENANT_ARCHIVED",
      entity: "tenant",
      entityId: tenantId,
    });
    return updated;
  },
};
