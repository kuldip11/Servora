/**
 * Branch service — business rules that used to live inline in the
 * controller: capability-merge validation on update (at least one order
 * type must stay enabled; dine-in can't be turned off with open dine-in
 * orders), and the last-active-branch / open-orders guards on delete.
 */
import { requirePermission } from "../../core/auth";
import type { AuthContext } from "../../core/auth";
import { branchRepository } from "./branch.repository";
import { writeAudit } from "../../core/audit";
import { NotFoundError } from "../../core/errors";
import {
  branchNotFound,
  allOrderTypesDisabled,
  branchHasOpenDineInOrders,
  lastActiveBranch,
  branchHasOpenOrders,
} from "./branch.errors";

export interface CreateBranchInput {
  name: string;
  address?: string | undefined;
  phone?: string | undefined;
  dineInEnabled?: boolean | undefined;
  takeawayEnabled?: boolean | undefined;
  deliveryEnabled?: boolean | undefined;
  onlineEnabled?: boolean | undefined;
  tablesEnabled?: boolean | undefined;
}

export interface UpdateBranchInput {
  name?: string | undefined;
  address?: string | undefined;
  phone?: string | undefined;
  dineInEnabled?: boolean | undefined;
  takeawayEnabled?: boolean | undefined;
  deliveryEnabled?: boolean | undefined;
  onlineEnabled?: boolean | undefined;
  tablesEnabled?: boolean | undefined;
}

const CAPABILITY_FIELDS = [
  "dineInEnabled",
  "takeawayEnabled",
  "deliveryEnabled",
  "onlineEnabled",
  "tablesEnabled",
] as const;

export const branchService = {
  // Branch-locked staff → only their own branch. Owner/manager → all
  // branches, or one specific branch from the server-issued active context (already resolved
  // into auth.branchId by requireAuthPlugin).
  async list(auth: AuthContext) {
    requirePermission(auth, "branch:read");
    return branchRepository.findMany(
      auth.tenantId,
      auth.tenantWide ? null : auth.branchId,
      auth.tenantWide ? undefined : auth.authorizedBranchIds,
    );
  },

  async create(auth: AuthContext, input: CreateBranchInput) {
    requirePermission(auth, "branch:create");
    const branch = await branchRepository.create({
      tenantId: auth.tenantId,
      ...input,
    });
    await writeAudit({
      tenantId: auth.tenantId,
      userId: auth.userId,
      action: "BRANCH_CREATED",
      entity: "branch",
      entityId: branch.id,
      metadata: { name: branch.name },
    });
    return branch;
  },

  async update(
    auth: AuthContext,
    branchId: string,
    changes: UpdateBranchInput,
  ) {
    requirePermission(auth, "branch:update");
    if (
      !auth.tenantWide &&
      !(auth.authorizedBranchIds ?? []).includes(branchId)
    ) {
      throw new NotFoundError("Branch", branchId, { id: branchId });
    }
    const touchesCapabilities = CAPABILITY_FIELDS.some(
      (field) => changes[field] !== undefined,
    );

    if (touchesCapabilities) {
      const existing = await branchRepository.findById(auth.tenantId, branchId);
      if (!existing) throw branchNotFound(branchId);

      // Merge the patch onto current values so we validate the resulting
      // state, not just the fields that happen to be in this request.
      const merged = {
        dineInEnabled: changes.dineInEnabled ?? existing.dineInEnabled,
        takeawayEnabled: changes.takeawayEnabled ?? existing.takeawayEnabled,
        deliveryEnabled: changes.deliveryEnabled ?? existing.deliveryEnabled,
        onlineEnabled: changes.onlineEnabled ?? existing.onlineEnabled,
      };

      // A branch needs at least one order type enabled, always.
      if (
        !merged.dineInEnabled &&
        !merged.takeawayEnabled &&
        !merged.deliveryEnabled &&
        !merged.onlineEnabled
      ) {
        throw allOrderTypesDisabled();
      }

      // Don't let dine-in get switched off while there are open dine-in
      // orders still running on this branch — same reasoning as the
      // "can't delete a table with an active order" guard.
      if (changes.dineInEnabled === false && existing.dineInEnabled) {
        const hasOpenDineIn = await branchRepository.hasOpenOrdersOfType(
          auth.tenantId,
          branchId,
          "DINE_IN",
        );
        if (hasOpenDineIn) throw branchHasOpenDineInOrders();
      }
    }

    const updated = await branchRepository.update(
      auth.tenantId,
      branchId,
      changes,
    );
    if (!updated) throw branchNotFound(branchId);
    await writeAudit({
      tenantId: auth.tenantId,
      userId: auth.userId,
      action: "BRANCH_UPDATED",
      entity: "branch",
      entityId: branchId,
      metadata: { changes },
    });
    return updated;
  },

  // Soft-delete (deactivate) — not a hard delete, mirrors the original
  // endpoint's behavior of flipping isActive rather than removing the row.
  async getTakeawayQr(auth: AuthContext, branchId: string) {
    requirePermission(auth, "branch:read");
    if (!auth.tenantWide && !(auth.authorizedBranchIds ?? []).includes(branchId)) {
      throw branchNotFound(branchId);
    }
    const branch = await branchRepository.findById(auth.tenantId, branchId);
    if (!branch) throw branchNotFound(branchId);
    return {
      branchId: branch.id,
      branchName: branch.name,
      enabled: branch.takeawayEnabled,
      token: branch.publicTakeawayQrToken,
    };
  },

  async regenerateTakeawayQr(auth: AuthContext, branchId: string) {
    requirePermission(auth, "branch:update");
    if (!auth.tenantWide && !(auth.authorizedBranchIds ?? []).includes(branchId)) {
      throw branchNotFound(branchId);
    }
    const branch = await branchRepository.findById(auth.tenantId, branchId);
    if (!branch) throw branchNotFound(branchId);
    const updated = await branchRepository.regenerateTakeawayQr(auth.tenantId, branchId);
    if (!updated) throw branchNotFound(branchId);
    await writeAudit({
      tenantId: auth.tenantId,
      userId: auth.userId,
      action: "BRANCH_TAKEAWAY_QR_REGENERATED",
      entity: "branch",
      entityId: branchId,
    });
    return {
      branchId: updated.id,
      branchName: updated.name,
      enabled: updated.takeawayEnabled,
      token: updated.publicTakeawayQrToken,
    };
  },

  async deactivate(auth: AuthContext, branchId: string) {
    requirePermission(auth, "branch:archive");
    if (
      !auth.tenantWide &&
      !(auth.authorizedBranchIds ?? []).includes(branchId)
    ) {
      throw branchNotFound(branchId);
    }
    const activeCount = await branchRepository.countActive(auth.tenantId);
    if (activeCount <= 1) throw lastActiveBranch();

    const hasOpenOrders = await branchRepository.hasOpenOrders(
      auth.tenantId,
      branchId,
    );
    if (hasOpenOrders) throw branchHasOpenOrders();

    const deactivated = await branchRepository.update(auth.tenantId, branchId, {
      isActive: false,
    });
    if (!deactivated) throw branchNotFound(branchId);
    await writeAudit({
      tenantId: auth.tenantId,
      userId: auth.userId,
      action: "BRANCH_ARCHIVED",
      entity: "branch",
      entityId: branchId,
    });
    return deactivated;
  },
};
