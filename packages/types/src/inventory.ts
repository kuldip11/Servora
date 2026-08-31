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

export interface WasteReason {
  id: string;
  tenantId: string;
  label: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryTransaction {
  id: string;
  inventoryItemId: string;
  transactionType: InventoryTransactionType;
  quantity: number;
  balanceBefore?: number;
  balanceAfter?: number;
  notes: string | null;
  performedBy: string | null;
  reversalOfDeductionId?: string | null;
  wasteReasonId?: string | null;
  wasteReason?: WasteReason | null;
  createdAt: string;
  inventoryItem?: InventoryItem;
  performedByUser?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
}

export interface SubRecipeIngredient {
  id: string;
  subRecipeId: string;
  inventoryItemId: string | null;
  ingredientSubRecipeId: string | null;
  quantityRequired: number;
  unit: InventoryUnit;
  inventoryItem?: InventoryItem | null;
  ingredientSubRecipe?: SubRecipe | null;
}

export interface SubRecipe {
  id: string;
  tenantId: string;
  branchId: string | null;
  name: string;
  yieldQuantity: number;
  yieldUnit: InventoryUnit;
  yieldPercent: number | null;
  ingredients: SubRecipeIngredient[];
}

export interface Recipe {
  id: string;
  menuItemId: string;
  inventoryItemId: string | null;
  subRecipeId: string | null;
  variantId: string | null;
  modifierOptionId: string | null;
  quantityRequired: number;
  unit: InventoryUnit;
  yieldPercent: number | null;
  isOptional: boolean;
  inventoryItem?: InventoryItem | null;
  subRecipe?: SubRecipe | null;
  variant?: { id: string; name: string } | null;
  modifierOption?: { id: string; name: string } | null;
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


export interface RecipeIngredientInput {
  inventoryItemId?: string | null;
  subRecipeId?: string | null;
  variantId?: string | null;
  modifierOptionId?: string | null;
  quantity: number;
  unit: InventoryUnit;
  yieldPercent?: number | null;
  isOptional?: boolean;
}

export interface SubRecipeIngredientInput {
  inventoryItemId?: string | null;
  ingredientSubRecipeId?: string | null;
  quantity: number;
  unit: InventoryUnit;
}

export interface SubRecipeInput {
  name: string;
  yieldQuantity: number;
  yieldUnit: InventoryUnit;
  yieldPercent?: number | null;
  ingredients: SubRecipeIngredientInput[];
}

export interface InventoryRecipeImpact {
  inventoryItemId: string;
  inventoryItemName: string;
  impacts: Array<{
    kind: "ITEM" | "VARIANT" | "MODIFIER_OPTION";
    menuItemId: string;
    menuItemName: string;
    entityId: string;
    entityName: string;
    computedAvailable: boolean;
  }>;
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
