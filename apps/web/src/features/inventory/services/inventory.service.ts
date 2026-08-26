import { apiClient } from "../../../shared/lib/api-client";
import type { InventoryItem } from "@pos/types";

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
}

export const inventoryService = {
  async list(): Promise<InventoryItem[]> {
    const res = await apiClient.get("/inventory/items");
    return res.data.data;
  },

  async add(input: InventoryItemFormInput): Promise<void> {
    await apiClient.post("/inventory/items", {
      ...input,
      branchId: input.branchId || undefined,
      currentStock: parseFloat(input.currentStock),
      minimumStock: parseFloat(input.minimumStock),
      reorderPoint: parseFloat(input.reorderPoint),
      costPerUnit: parseFloat(input.costPerUnit),
    });
  },

  async updateStock(itemId: string, input: StockUpdateInput): Promise<void> {
    await apiClient.patch(`/inventory/items/${itemId}/stock`, {
      quantity: parseFloat(input.quantity),
      transactionType: input.transactionType,
      notes: input.notes || undefined,
    });
  },
};
