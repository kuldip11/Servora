import type { InventoryTransactionType, InventoryUnit } from "@pos/types";

export interface CreateInventoryItemInput {
  name: string;
  unit: InventoryUnit;
  currentStock: number;
  minimumStock: number;
  reorderPoint: number;
  costPerUnit: number;
  branchId?: string | undefined;
}

export interface UpdateStockInput {
  quantity: number;
  transactionType: InventoryTransactionType;
  notes?: string | undefined;
  wasteReasonId?: string | undefined;
}

export interface RecipeNeedItemInput {
  menuItemId: string;
  variantId?: string | null | undefined;
  quantity: number;
  weightQuantity?: number | string | null | undefined;
  weightUnit?: "G" | "KG" | "LB" | "OZ" | null | undefined;
  selectedOptions?:
    | Array<{
        optionId: string;
        quantity?: number | undefined;
      }>
    | undefined;
}

export interface InventoryOrderItemInput extends RecipeNeedItemInput {
  orderItemId: string;
}
