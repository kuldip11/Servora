import type { FoodType, SpiceLevel } from "./menu";

export type InventoryUnit =
  "KG" | "GRAMS" | "LITERS" | "ML" | "PIECES" | "PACKETS";

export type InventoryTransactionType = "IN" | "OUT" | "ADJUSTMENT" | "WASTE";

export interface InventoryItem {
  id: string;
  tenantId: string;
  branchId: string;
  branch?: {
    id: string;
    name: string;
  };
  name: string;
  unit: InventoryUnit;
  currentStock: number;
  minimumStock: number;
  reorderPoint: number;
  costPerUnit: number;
  isActive: boolean;
}

export interface InventoryTransaction {
  id: string;
  inventoryItemId: string;
  transactionType: InventoryTransactionType;
  quantity: number;
  notes: string | null;
  performedBy: string;
  createdAt: string;
}

export interface Recipe {
  id: string;
  menuItemId: string;
  inventoryItemId: string;
  quantityRequired: number;
  unit: InventoryUnit;
  isOptional: boolean;
  inventoryItem?: InventoryItem;
}

export interface MenuTemplateItem {
  id: string;
  templateId: string;
  name: string;
  description: string | null;
  basePrice: number;
  taxRate: number;
  foodType: FoodType;
  spiceLevel: SpiceLevel | null;
  prepTimeMinutes: number | null;
  hsnCode: string | null;
  sortOrder: number;
}

export interface MenuTemplate {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  sourceCategoryName: string | null;
  createdAt: string;
  updatedAt: string;
  items: MenuTemplateItem[];
}

export interface RecipeAvailability {
  canOrder: boolean;
  missingIngredients: Array<{
    inventoryItemId: string;
    name: string;
    required: number;
    available: number;
    unit: InventoryUnit;
  }>;
}
