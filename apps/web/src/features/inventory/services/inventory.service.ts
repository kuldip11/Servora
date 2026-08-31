import { apiClient } from "../../../shared/lib/api-client";
import type { InventoryItem, InventoryRecipeImpact, InventoryTransaction, WasteReason } from "@pos/types";

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

  async recipeImpact(itemId: string): Promise<InventoryRecipeImpact> {
    const res = await apiClient.get(`/inventory/items/${itemId}/recipe-impact`);
    return res.data.data;
  },

  async transactions(): Promise<InventoryTransaction[]> {
    const res = await apiClient.get("/inventory/transactions");
    return res.data.data;
  },

  async updateStock(itemId: string, input: StockUpdateInput): Promise<void> {
    await apiClient.patch(`/inventory/items/${itemId}/stock`, {
      quantity: parseFloat(input.quantity),
      transactionType: input.transactionType,
      notes: input.notes || undefined,
      wasteReasonId: input.wasteReasonId || undefined,
    });
  },

  async wasteReasons(): Promise<WasteReason[]> {
    const res = await apiClient.get("/inventory/waste-reasons");
    return res.data.data;
  },

  async createWasteReason(label: string): Promise<WasteReason> {
    const res = await apiClient.post("/inventory/waste-reasons", { label });
    return res.data.data;
  },

  async logWaste(itemId: string, input: { quantity: number; wasteReasonId: string; notes?: string }): Promise<void> {
    await apiClient.post(`/inventory/items/${itemId}/waste`, input);
  },
};
