/**
 * Inventory controller — thin handlers only. Auth/branch resolution comes
 * from `requireAuthPlugin` (applied in `inventory.route.ts`); business
 * rules live in `inventory.service.ts`.
 */
import type { AuthContext } from '../../core/auth';
import { successResponse, createdResponse } from '../../core/response';
import { inventoryService, type CreateInventoryItemInput, type UpdateStockInput } from './inventory.service';

export const inventoryController = {
  async list(auth: AuthContext) {
    const items = await inventoryService.list(auth);
    return successResponse(items);
  },

  async create(auth: AuthContext, input: CreateInventoryItemInput) {
    const item = await inventoryService.create(auth, input);
    return createdResponse(item);
  },

  async updateStock(auth: AuthContext, itemId: string, input: UpdateStockInput) {
    const result = await inventoryService.updateStock(auth, itemId, input);
    return successResponse(result);
  },

  async lowStockAlerts(auth: AuthContext) {
    const items = await inventoryService.lowStockAlerts(auth);
    return successResponse(items);
  },
};
