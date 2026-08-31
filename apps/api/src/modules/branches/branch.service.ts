

import { requirePermission } from "../../core/auth";
import type { AuthContext } from "../../core/auth";
import { branchRepository } from "./branch.repository";
import { writeAudit } from "../../core/audit";
import { NotFoundError, ValidationError } from "../../core/errors";
import {
  branchNotFound,
  allOrderTypesDisabled,
  branchHasOpenDineInOrders,
  lastActiveBranch,
  branchHasOpenOrders,
  branchCodeAlreadyExists,
  tablesRequireDineIn,
} from "./branch.errors";

export interface CreateBranchInput {
  name: string;
  code: string;
  timezone: string;
  currency: string;
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
  code?: string | undefined;
  timezone?: string | undefined;
  currency?: string | undefined;
  address?: string | undefined;
  phone?: string | undefined;
  dineInEnabled?: boolean | undefined;
  takeawayEnabled?: boolean | undefined;
  deliveryEnabled?: boolean | undefined;
  onlineEnabled?: boolean | undefined;
  tablesEnabled?: boolean | undefined;
}

function assertValidTimezone(timezone: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format();
  } catch {
    throw new ValidationError(`Invalid IANA timezone: ${timezone}`);
  }
}

function assertCapabilityProfile(profile: {
  dineInEnabled: boolean;
  takeawayEnabled: boolean;
  deliveryEnabled: boolean;
  onlineEnabled: boolean;
  tablesEnabled: boolean;
}) {
  if (!profile.dineInEnabled && profile.tablesEnabled)
    throw tablesRequireDineIn();
  if (
    !profile.dineInEnabled &&
    !profile.takeawayEnabled &&
    !profile.deliveryEnabled &&
    !profile.onlineEnabled
  ) {
    throw allOrderTypesDisabled();
  }
}

import { BRANCH_CAPABILITY_FIELDS } from "./constants";

export const branchService = {

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
    const normalizedCode = input.code.trim().toUpperCase();
    const normalizedTimezone = input.timezone.trim();
    assertValidTimezone(normalizedTimezone);
    assertCapabilityProfile({
      dineInEnabled: input.dineInEnabled ?? true,
      takeawayEnabled: input.takeawayEnabled ?? true,
      deliveryEnabled: input.deliveryEnabled ?? true,
      onlineEnabled: input.onlineEnabled ?? true,
      tablesEnabled: input.tablesEnabled ?? true,
    });
    const existingCode = await branchRepository.findByCode(
      auth.tenantId,
      normalizedCode,
    );
    if (existingCode) throw branchCodeAlreadyExists(normalizedCode);
    const branch = await branchRepository.create({
      tenantId: auth.tenantId,
      ...input,
      code: normalizedCode,
      timezone: normalizedTimezone,
      currency: input.currency.trim().toUpperCase(),
    });
    await writeAudit({
      tenantId: auth.tenantId,
      userId: auth.userId,
      branchId: auth.branchId,
      requestId: auth.requestId,
      ipAddress: auth.ipAddress,
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
    if (changes.code !== undefined) {
      const normalizedCode = changes.code.trim().toUpperCase();
      const existingCode = await branchRepository.findByCode(
        auth.tenantId,
        normalizedCode,
      );
      if (existingCode && existingCode.id !== branchId)
        throw branchCodeAlreadyExists(normalizedCode);
      changes = { ...changes, code: normalizedCode };
    }
    if (changes.timezone !== undefined) {
      const timezone = changes.timezone.trim();
      assertValidTimezone(timezone);
      changes = { ...changes, timezone };
    }
    if (changes.currency !== undefined) {
      changes = { ...changes, currency: changes.currency.trim().toUpperCase() };
    }

    const touchesCapabilities = BRANCH_CAPABILITY_FIELDS.some(
      (field) => changes[field] !== undefined,
    );

    if (touchesCapabilities) {
      const existing = await branchRepository.findById(auth.tenantId, branchId);
      if (!existing) throw branchNotFound(branchId);

      const merged = {
        dineInEnabled: changes.dineInEnabled ?? existing.dineInEnabled,
        takeawayEnabled: changes.takeawayEnabled ?? existing.takeawayEnabled,
        deliveryEnabled: changes.deliveryEnabled ?? existing.deliveryEnabled,
        onlineEnabled: changes.onlineEnabled ?? existing.onlineEnabled,
        tablesEnabled: changes.tablesEnabled ?? existing.tablesEnabled,
      };

      assertCapabilityProfile(merged);

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
      branchId: auth.branchId,
      requestId: auth.requestId,
      ipAddress: auth.ipAddress,
      action: "BRANCH_UPDATED",
      entity: "branch",
      entityId: branchId,
      metadata: { changes },
    });
    return updated;
  },

  async getTakeawayQr(auth: AuthContext, branchId: string) {
    requirePermission(auth, "branch:read");
    if (
      !auth.tenantWide &&
      !(auth.authorizedBranchIds ?? []).includes(branchId)
    ) {
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
    if (
      !auth.tenantWide &&
      !(auth.authorizedBranchIds ?? []).includes(branchId)
    ) {
      throw branchNotFound(branchId);
    }
    const branch = await branchRepository.findById(auth.tenantId, branchId);
    if (!branch) throw branchNotFound(branchId);
    const updated = await branchRepository.regenerateTakeawayQr(
      auth.tenantId,
      branchId,
    );
    if (!updated) throw branchNotFound(branchId);
    await writeAudit({
      tenantId: auth.tenantId,
      userId: auth.userId,
      branchId: auth.branchId,
      requestId: auth.requestId,
      ipAddress: auth.ipAddress,
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
      branchId: auth.branchId,
      requestId: auth.requestId,
      ipAddress: auth.ipAddress,
      action: "BRANCH_ARCHIVED",
      entity: "branch",
      entityId: branchId,
    });
    return deactivated;
  },
};
