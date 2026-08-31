
import { eq, and, inArray } from "drizzle-orm";
import { db } from "../../../db";
import {
  menuItems,
  recipes,
  inventoryItems,
  menuItemVariants,
  modifierOptions,
  menuItemModifierGroups,
  subRecipes,
} from "../../../db/schema";
import type { InventoryUnit } from "@pos/types";

export interface RecipeWriteRow {
  inventoryItemId?: string | null;
  subRecipeId?: string | null;
  variantId?: string | null;
  modifierOptionId?: string | null;
  quantity: number;
  unit: InventoryUnit;
  yieldPercent?: number | null;
  isOptional?: boolean;
}

const recipeRelations = {
  inventoryItem: true,
  subRecipe: true,
  variant: true,
  modifierOption: true,
} as const;

export const recipesRepository = {
  async findItem(tenantId: string, itemId: string) {
    return db.query.menuItems.findFirst({
      where: and(eq(menuItems.id, itemId), eq(menuItems.tenantId, tenantId)),
      columns: { id: true, enableRecipeDeduction: true, branchId: true },
    });
  },

  async getItemRecipe(itemId: string) {
    return db.query.recipes.findMany({
      where: eq(recipes.menuItemId, itemId),
      with: recipeRelations,
    });
  },

  async findOwnedInventorySources(tenantId: string, inventoryItemIds: string[]) {
    if (!inventoryItemIds.length) return [];
    return db.query.inventoryItems.findMany({
      where: and(
        eq(inventoryItems.tenantId, tenantId),
        inArray(inventoryItems.id, inventoryItemIds),
      ),
      columns: { id: true, branchId: true, unit: true },
    });
  },

  async findOwnedSubRecipeSources(tenantId: string, ids: string[]) {
    if (!ids.length) return [];
    return db.query.subRecipes.findMany({
      where: and(eq(subRecipes.tenantId, tenantId), inArray(subRecipes.id, ids)),
      columns: { id: true, branchId: true, yieldUnit: true },
    });
  },

  async findVariantForItem(itemId: string, variantId: string) {
    return db.query.menuItemVariants.findFirst({
      where: and(
        eq(menuItemVariants.id, variantId),
        eq(menuItemVariants.menuItemId, itemId),
      ),
      columns: { id: true },
    });
  },

  async findModifierOptionForItem(itemId: string, optionId: string) {
    const [row] = await db
      .select({ id: modifierOptions.id })
      .from(modifierOptions)
      .innerJoin(
        menuItemModifierGroups,
        eq(menuItemModifierGroups.modifierGroupId, modifierOptions.modifierGroupId),
      )
      .where(
        and(
          eq(menuItemModifierGroups.menuItemId, itemId),
          eq(modifierOptions.id, optionId),
        ),
      )
      .limit(1);
    return row ?? null;
  },

  async replaceRecipe(itemId: string, ingredients: RecipeWriteRow[]) {
    return db.transaction(async (tx) => {
      await tx.delete(recipes).where(eq(recipes.menuItemId, itemId));
      if (ingredients.length) {
        await tx.insert(recipes).values(
          ingredients.map((ing) => ({
            menuItemId: itemId,
            inventoryItemId: ing.inventoryItemId ?? null,
            subRecipeId: ing.subRecipeId ?? null,
            variantId: ing.variantId ?? null,
            modifierOptionId: ing.modifierOptionId ?? null,
            quantityRequired: String(ing.quantity),
            unit: ing.unit,
            yieldPercent:
              ing.yieldPercent == null ? null : String(ing.yieldPercent),
            isOptional: ing.isOptional ?? false,
          })),
        );
      }
      return tx.query.recipes.findMany({
        where: eq(recipes.menuItemId, itemId),
        with: recipeRelations,
      });
    });
  },
};
