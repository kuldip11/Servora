/**
 * Menu bulk-operations controller — thin handlers only. Auth/branch
 * resolution comes from `requireAuthPlugin` (applied in `bulk-ops.route.ts`);
 * orchestration lives in `bulk-ops.service.ts`.
 */
import type { MenuItemStatus } from '@pos/types';
import type { AuthContext } from '../../../core/auth';
import { successResponse } from '../../../core/response';
import { bulkOpsService } from './bulk-ops.service';
import type { BulkMode, PriceMode } from './bulk-ops.repository';

export const bulkOpsController = {
  async updateItemsStatus(auth: AuthContext, itemIds: string[], status: MenuItemStatus, reason: string | undefined) {
    const result = await bulkOpsService.updateItemsStatus(auth, itemIds, status, reason);
    return successResponse(result);
  },

  async updateItemsCategory(auth: AuthContext, itemIds: string[], categoryId: string) {
    const result = await bulkOpsService.updateItemsCategory(auth, itemIds, categoryId);
    return successResponse(result);
  },

  async bulkSetItemTags(auth: AuthContext, itemIds: string[], tagIds: string[], mode: BulkMode) {
    const result = await bulkOpsService.bulkSetItemTags(auth, itemIds, tagIds, mode);
    return successResponse(result);
  },

  async bulkSetItemModifierGroups(auth: AuthContext, itemIds: string[], modifierGroupIds: string[], mode: BulkMode) {
    const result = await bulkOpsService.bulkSetItemModifierGroups(auth, itemIds, modifierGroupIds, mode);
    return successResponse(result);
  },

  async bulkUpdatePrice(auth: AuthContext, itemIds: string[], priceChange: number, mode: PriceMode) {
    const result = await bulkOpsService.bulkUpdatePrice(auth, itemIds, priceChange, mode);
    return successResponse(result);
  },

  async bulkDeleteItems(auth: AuthContext, itemIds: string[]) {
    const result = await bulkOpsService.bulkDeleteItems(auth, itemIds);
    return successResponse(result);
  },
};
