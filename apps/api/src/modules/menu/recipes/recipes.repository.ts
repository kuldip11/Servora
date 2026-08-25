/**
 * Menu recipes repository — data access for the "recipes" (menu item ↔
 * inventory) sub-domain only. Extracted from the monolithic
 * `modules/menu/repository.ts` verbatim — see docs/NEXT_STEPS.md.
 */
import { eq, and, inArray } from "drizzle-orm";
import { db } from "../../../db";
import { menuItems, recipes, inventoryItems } from "../../../db/schema";
import type { InventoryUnit } from "@pos/types";

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
      with: { inventoryItem: true },
    });
  },

  // Ingredients must belong to the same tenant — otherwise a stray id
  // would silently create a cross-tenant reference. Returns the subset of
  // `inventoryItemIds` that really are owned by this tenant.
  async findOwnedInventoryItemIds(
    tenantId: string,
    inventoryItemIds: string[],
  ): Promise<Set<string>> {
    if (!inventoryItemIds.length) return new Set();
    const owned = await db.query.inventoryItems.findMany({
      where: and(
        eq(inventoryItems.tenantId, tenantId),
        inArray(inventoryItems.id, inventoryItemIds),
      ),
      columns: { id: true },
    });
    return new Set(owned.map((i) => i.id));
  },

  async findInventoryItem(tenantId: string, inventoryItemId: string) {
    return db.query.inventoryItems.findFirst({
      where: and(
        eq(inventoryItems.id, inventoryItemId),
        eq(inventoryItems.tenantId, tenantId),
      ),
    });
  },

  // Replaces the item's full ingredient list in one call — simpler for the
  // recipe-builder UI than diffing add/remove, and avoids ending up with
  // stale ingredient rows if the caller forgets to clean up.
  async replaceRecipe(
    itemId: string,
    ingredients: Array<{
      inventoryItemId: string;
      quantity: number;
      unit: InventoryUnit;
      isOptional?: boolean;
    }>,
  ) {
    return db.transaction(async (tx) => {
      await tx.delete(recipes).where(eq(recipes.menuItemId, itemId));
      if (ingredients.length) {
        await tx.insert(recipes).values(
          ingredients.map((ing) => ({
            menuItemId: itemId,
            inventoryItemId: ing.inventoryItemId,
            quantityRequired: String(ing.quantity),
            unit: ing.unit,
            isOptional: ing.isOptional ?? false,
          })),
        );
      }
      return tx.query.recipes.findMany({
        where: eq(recipes.menuItemId, itemId),
        with: { inventoryItem: true },
      });
    });
  },

  async deleteRecipeIngredient(itemId: string, inventoryItemId: string) {
    await db
      .delete(recipes)
      .where(
        and(
          eq(recipes.menuItemId, itemId),
          eq(recipes.inventoryItemId, inventoryItemId),
        ),
      );
  },

  async upsertRecipeIngredient(
    itemId: string,
    inventoryItemId: string,
    quantity: number,
    unit: InventoryUnit,
    isOptional: boolean,
  ) {
    const [row] = await db
      .insert(recipes)
      .values({
        menuItemId: itemId,
        inventoryItemId,
        quantityRequired: String(quantity),
        unit,
        isOptional,
      })
      .onConflictDoUpdate({
        target: [recipes.menuItemId, recipes.inventoryItemId],
        set: { quantityRequired: String(quantity), unit, isOptional },
      })
      .returning();
    return row;
  },

  async getRequiredIngredients(itemId: string) {
    return db.query.recipes.findMany({
      where: and(eq(recipes.menuItemId, itemId), eq(recipes.isOptional, false)),
      with: { inventoryItem: true },
    });
  },
};
