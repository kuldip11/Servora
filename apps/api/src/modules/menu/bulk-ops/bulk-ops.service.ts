/**
 * Menu bulk-operations service. The legacy controller had no business
 * rules of its own for these endpoints beyond validating the request
 * shape (now the `.validator.ts` schemas) and calling straight through to
 * the repository — this layer preserves that, so it's intentionally thin.
 */
import type { AuthContext } from '../../../core/auth';
import { bulkOpsRepository, type BulkMode, type PriceMode } from './bulk-ops.repository';
import type { MenuItemStatus } from '@pos/types';
import { requirePermission } from '../../../core/auth';
import { assertMenuResourceBranch } from '../menu-authorization';

async function assertScope(auth: AuthContext, itemIds: string[]) {
  const rows = await bulkOpsRepository.findItemScopes(auth.tenantId, itemIds);
  for (const row of rows) assertMenuResourceBranch(auth, row.branchId);
}

export const bulkOpsService = {
  async updateItemsStatus(auth: AuthContext, itemIds: string[], status: MenuItemStatus, reason?: string) {
    requirePermission(auth, 'menu:update');
    await assertScope(auth, itemIds);
    return bulkOpsRepository.updateItemsStatus(auth.tenantId, itemIds, status, reason);
  },

  async updateItemsCategory(auth: AuthContext, itemIds: string[], categoryId: string) {
    requirePermission(auth, 'menu:update');
    await assertScope(auth, itemIds);
    return bulkOpsRepository.updateItemsCategory(auth.tenantId, itemIds, categoryId);
  },

  async bulkSetItemTags(auth: AuthContext, itemIds: string[], tagIds: string[], mode: BulkMode) {
    requirePermission(auth, 'menu:update');
    await assertScope(auth, itemIds);
    return bulkOpsRepository.bulkSetItemTags(auth.tenantId, itemIds, tagIds, mode);
  },

  async bulkSetItemModifierGroups(auth: AuthContext, itemIds: string[], modifierGroupIds: string[], mode: BulkMode) {
    requirePermission(auth, 'menu:update');
    await assertScope(auth, itemIds);
    return bulkOpsRepository.bulkSetItemModifierGroups(auth.tenantId, itemIds, modifierGroupIds, mode);
  },

  async bulkUpdatePrice(auth: AuthContext, itemIds: string[], priceChange: number, mode: PriceMode) {
    requirePermission(auth, 'menu:update');
    await assertScope(auth, itemIds);
    return bulkOpsRepository.bulkUpdatePrice(auth.tenantId, itemIds, priceChange, mode);
  },

  async bulkDeleteItems(auth: AuthContext, itemIds: string[]) {
    requirePermission(auth, 'menu:delete');
    await assertScope(auth, itemIds);
    return bulkOpsRepository.bulkDeleteItems(auth.tenantId, itemIds);
  },
};
