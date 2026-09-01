import type { InventoryUnit } from "@pos/types";
import { ValidationError } from "@/core/errors";
import type { inventoryRepository } from "./inventory.repository";
import {
  areInventoryUnitsCompatible,
  convertInventoryQuantity,
} from "./inventory-units";

type RequiredRecipeRow = Awaited<
  ReturnType<typeof inventoryRepository.findRequiredRecipeLines>
>[number];

export type ResolvedRawNeed = {
  inventoryItemId: string;
  name: string;
  currentStock: number;
  unit: InventoryUnit;
  neededQuantity: number;
  costPerUnit: number;
};

type RecipeSelectionInput = {
  menuItemId: string;
  variantId?: string | null | undefined;
  selectedOptions?:
    Array<{ optionId: string; quantity?: number | undefined }> | undefined;
};

export const weightRecipeScale = (
  weightQuantity?: number | string | null,
  weightUnit?: "G" | "KG" | "LB" | "OZ" | null,
): number => {
  if (weightQuantity == null || weightUnit == null) return 1;
  const quantity = Number(weightQuantity);
  if (!Number.isFinite(quantity) || quantity <= 0) return 1;
  switch (weightUnit) {
    case "G":
      return quantity / 1000;
    case "KG":
      return quantity;
    case "LB":
      return quantity * 0.45359237;
    case "OZ":
      return quantity * 0.028349523125;
  }
};

export const recipeYieldFactor = (value: string | null | undefined): number => {
  if (value == null) return 1;
  const percent = Number(value);
  return Number.isFinite(percent) && percent > 0 ? percent / 100 : 1;
};

const recipeSourceKey = (row: RequiredRecipeRow): string => {
  return row.inventoryItemId
    ? `inventory:${row.inventoryItemId}`
    : `sub:${row.subRecipeId}`;
};

export const applicableRecipeRows = (
  rows: RequiredRecipeRow[],
  item: RecipeSelectionInput,
  requireRecipeDeductionEnabled = true,
) => {
  const itemRows = rows.filter(
    (row) =>
      row.menuItemId === item.menuItemId &&
      (!requireRecipeDeductionEnabled || row.menuItem.enableRecipeDeduction),
  );
  const base = itemRows.filter(
    (row) => !row.variantId && !row.modifierOptionId,
  );
  const variantRows = item.variantId
    ? itemRows.filter((row) => row.variantId === item.variantId)
    : [];
  const overridden = new Set(variantRows.map(recipeSourceKey));
  const selected: Array<{ row: RequiredRecipeRow; multiplier: number }> = [
    ...base
      .filter((row) => !overridden.has(recipeSourceKey(row)))
      .map((row) => ({ row, multiplier: 1 })),
    ...variantRows.map((row) => ({ row, multiplier: 1 })),
  ];

  const optionQuantities = new Map<string, number>();
  for (const option of item.selectedOptions ?? []) {
    optionQuantities.set(
      option.optionId,
      (optionQuantities.get(option.optionId) ?? 0) + (option.quantity ?? 1),
    );
  }
  for (const row of itemRows) {
    if (!row.modifierOptionId) continue;
    const multiplier = optionQuantities.get(row.modifierOptionId) ?? 0;
    if (multiplier > 0) selected.push({ row, multiplier });
  }
  return selected;
};

export const convertRecipeQuantity = (
  quantity: number,
  from: InventoryUnit,
  to: InventoryUnit,
  label: string,
): number => {
  if (!areInventoryUnitsCompatible(from, to)) {
    throw new ValidationError(
      `${label} uses incompatible units (${from} → ${to})`,
    );
  }
  return convertInventoryQuantity(quantity, from, to);
};

export const aggregateRawNeeds = (needs: ResolvedRawNeed[]) => {
  const aggregated = new Map<string, ResolvedRawNeed>();
  for (const need of needs) {
    const existing = aggregated.get(need.inventoryItemId);
    if (existing) existing.neededQuantity += need.neededQuantity;
    else aggregated.set(need.inventoryItemId, { ...need });
  }
  return Array.from(aggregated.values());
};

export const canSatisfyNeeds = (needs: ResolvedRawNeed[]) => {
  return aggregateRawNeeds(needs).every(
    (need) => need.currentStock >= need.neededQuantity,
  );
};
