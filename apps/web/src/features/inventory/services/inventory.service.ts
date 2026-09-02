import { createInventoryApi } from "@pos/api-client";
import { apiClient } from "@/shared/lib/api-client";
import type { InventoryListFilters, PaginatedResult } from "@pos/api-client";
import type {
  InventoryItem,
  InventoryRecipeImpact,
  InventoryTransaction,
  WasteReason,
} from "@pos/types";

export interface InventoryItemFormInput {
  name: string;
  unit: string;
  currentStock: string;
  minimumStock: string;
  reorderPoint: string;
  costPerUnit: string;
  branchId?: string | undefined;
}

export interface StockUpdateInput {
  quantity: string;
  transactionType: string;
  notes: string;
  wasteReasonId?: string | undefined;
}

const inventoryApi = createInventoryApi(apiClient);

export const inventoryService = {
  list(
    filters: InventoryListFilters = {},
  ): Promise<PaginatedResult<InventoryItem>> {
    return inventoryApi.list(filters);
  },
  lowStock(): Promise<InventoryItem[]> {
    return inventoryApi.lowStock();
  },
  async add(input: InventoryItemFormInput): Promise<void> {
    await inventoryApi.create({
      name: input.name,
      unit: input.unit as
        "KG" | "GRAMS" | "LITERS" | "ML" | "PIECES" | "PACKETS",
      currentStock: parseFloat(input.currentStock),
      minimumStock: parseFloat(input.minimumStock),
      reorderPoint: parseFloat(input.reorderPoint),
      costPerUnit: parseFloat(input.costPerUnit),
      ...(input.branchId ? { branchId: input.branchId } : {}),
    });
  },
  recipeImpact(itemId: string): Promise<InventoryRecipeImpact> {
    return inventoryApi.recipeImpact(itemId);
  },
  transactions(): Promise<InventoryTransaction[]> {
    return inventoryApi.transactions();
  },
  async updateStock(itemId: string, input: StockUpdateInput): Promise<void> {
    await inventoryApi.updateStock(itemId, {
      quantity: parseFloat(input.quantity),
      transactionType: input.transactionType as
        "IN" | "OUT" | "ADJUSTMENT" | "WASTE",
      ...(input.notes ? { notes: input.notes } : {}),
      ...(input.wasteReasonId ? { wasteReasonId: input.wasteReasonId } : {}),
    });
  },
  wasteReasons(): Promise<WasteReason[]> {
    return inventoryApi.wasteReasons();
  },
  createWasteReason(label: string): Promise<WasteReason> {
    return inventoryApi.createWasteReason(label);
  },
  logWaste(
    itemId: string,
    input: { quantity: number; wasteReasonId: string; notes?: string },
  ): Promise<void> {
    return inventoryApi.logWaste(itemId, input);
  },
};
