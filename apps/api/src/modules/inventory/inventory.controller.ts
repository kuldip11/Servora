import type { AuthContext } from "@/core/auth";
import {
  successResponse,
  createdResponse,
  paginatedResponse,
} from "@/core/response";
import {
  inventoryService,
  type CreateInventoryItemInput,
  type UpdateStockInput,
} from "./inventory.service";

export const inventoryController = {
  async list(
    auth: AuthContext,
    filters: {
      page?: number;
      limit?: number;
      search?: string;
      lowStockOnly?: boolean;
    } = {},
  ) {
    const result = await inventoryService.list(auth, filters);
    return paginatedResponse(result.items, {
      page: result.page,
      limit: result.limit,
      total: result.total,
    });
  },

  async create(auth: AuthContext, input: CreateInventoryItemInput) {
    const item = await inventoryService.create(auth, input);
    return createdResponse(item);
  },

  async updateStock(
    auth: AuthContext,
    itemId: string,
    input: UpdateStockInput,
  ) {
    const result = await inventoryService.updateStock(auth, itemId, input);
    return successResponse(result);
  },

  async lowStockAlerts(auth: AuthContext) {
    const items = await inventoryService.lowStockAlerts(auth);
    return successResponse(items);
  },

  async recentTransactions(auth: AuthContext) {
    const transactions = await inventoryService.recentTransactions(auth);
    return successResponse(transactions);
  },

  async recipeImpact(auth: AuthContext, itemId: string) {
    return successResponse(
      await inventoryService.getRecipeImpact(auth, itemId),
    );
  },

  async listWasteReasons(auth: AuthContext, includeInactive = false) {
    return successResponse(
      await inventoryService.listWasteReasons(auth, includeInactive),
    );
  },

  async createWasteReason(auth: AuthContext, input: { label: string }) {
    return createdResponse(
      await inventoryService.createWasteReason(auth, input.label),
    );
  },

  async updateWasteReason(
    auth: AuthContext,
    id: string,
    input: { label?: string | undefined; isActive?: boolean | undefined },
  ) {
    return successResponse(
      await inventoryService.updateWasteReason(auth, id, input),
    );
  },

  async logWaste(
    auth: AuthContext,
    itemId: string,
    input: {
      quantity: number;
      wasteReasonId: string;
      notes?: string | undefined;
    },
  ) {
    return successResponse(
      await inventoryService.logWaste(auth, itemId, input),
    );
  },
};
