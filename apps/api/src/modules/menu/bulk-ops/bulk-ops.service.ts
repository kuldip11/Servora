
import type { AuthContext } from "../../../core/auth";
import {
  bulkOpsRepository,
  type BulkMode,
  type PriceMode,
} from "./bulk-ops.repository";
import type { MenuItemStatus } from "@pos/types";
import { requirePermission } from "../../../core/auth";
import { assertMenuResourceBranch } from "../menu-authorization";
import { menuChangeLog } from "../change-log/menu-change-log";

async function recordItems(auth: AuthContext, itemIds: string[], changeType: "UPDATED" | "DELETED", diff: Record<string, unknown>) {
  await menuChangeLog.recordMany(auth, itemIds.map((entityId) => ({
    entityType: "MENU_ITEM", entityId, changeType, diff,
  })));
}

async function assertScope(auth: AuthContext, itemIds: string[]) {
  const rows = await bulkOpsRepository.findItemScopes(auth.tenantId, itemIds);
  for (const row of rows) assertMenuResourceBranch(auth, row.branchId);
}

export const bulkOpsService = {
  async updateItemsStatus(
    auth: AuthContext,
    itemIds: string[],
    status: MenuItemStatus,
    reason?: string,
  ) {
    requirePermission(auth, "menu:update");
    await assertScope(auth, itemIds);
    const result = await bulkOpsRepository.updateItemsStatus(
      auth.tenantId,
      itemIds,
      status,
      reason,
    );
    await recordItems(auth, itemIds, "UPDATED", { status, reason: reason ?? null });
    return result;
  },

  async updateItemsCategory(
    auth: AuthContext,
    itemIds: string[],
    categoryId: string,
  ) {
    requirePermission(auth, "menu:update");
    await assertScope(auth, itemIds);
    const result = await bulkOpsRepository.updateItemsCategory(
      auth.tenantId,
      itemIds,
      categoryId,
    );
    await recordItems(auth, itemIds, "UPDATED", { categoryId });
    return result;
  },

  async bulkSetItemTags(
    auth: AuthContext,
    itemIds: string[],
    tagIds: string[],
    mode: BulkMode,
  ) {
    requirePermission(auth, "menu:update");
    await assertScope(auth, itemIds);
    const result = await bulkOpsRepository.bulkSetItemTags(
      auth.tenantId,
      itemIds,
      tagIds,
      mode,
    );
    await recordItems(auth, itemIds, "UPDATED", { tagIds, mode });
    return result;
  },

  async bulkSetItemModifierGroups(
    auth: AuthContext,
    itemIds: string[],
    modifierGroupIds: string[],
    mode: BulkMode,
  ) {
    requirePermission(auth, "menu:update");
    await assertScope(auth, itemIds);
    const result = await bulkOpsRepository.bulkSetItemModifierGroups(
      auth.tenantId,
      itemIds,
      modifierGroupIds,
      mode,
    );
    await recordItems(auth, itemIds, "UPDATED", { modifierGroupIds, mode });
    return result;
  },

  async bulkUpdatePrice(
    auth: AuthContext,
    itemIds: string[],
    priceChange: number,
    mode: PriceMode,
  ) {
    requirePermission(auth, "menu:update");
    await assertScope(auth, itemIds);
    const result = await bulkOpsRepository.bulkUpdatePrice(
      auth.tenantId,
      itemIds,
      priceChange,
      mode,
    );
    await recordItems(auth, itemIds, "UPDATED", { priceChange, mode });
    return result;
  },

  async bulkDeleteItems(auth: AuthContext, itemIds: string[]) {
    requirePermission(auth, "menu:delete");
    await assertScope(auth, itemIds);
    const result = await bulkOpsRepository.bulkDeleteItems(auth.tenantId, itemIds);
    await recordItems(auth, itemIds, "DELETED", {});
    return result;
  },
};
