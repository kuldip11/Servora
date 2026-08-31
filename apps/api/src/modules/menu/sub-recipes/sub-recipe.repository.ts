import { and, eq, inArray } from "drizzle-orm";
import { db } from "../../../db";
import {
  subRecipes,
  subRecipeIngredients,
  inventoryItems,
  recipes,
} from "../../../db/schema";
import type { InventoryUnit } from "@pos/types";

export interface SubRecipeIngredientWrite {
  inventoryItemId?: string | null;
  ingredientSubRecipeId?: string | null;
  quantity: number;
  unit: InventoryUnit;
}

const relations = {
  ingredients: {
    with: { inventoryItem: true, ingredientSubRecipe: true },
  },
} as const;

export const subRecipeRepository = {
  async list(tenantId: string, branchId?: string | null) {
    return db.query.subRecipes.findMany({
      where: branchId
        ? and(eq(subRecipes.tenantId, tenantId), eq(subRecipes.branchId, branchId))
        : eq(subRecipes.tenantId, tenantId),
      with: relations,
      orderBy: (t, { asc }) => [asc(t.name)],
    });
  },

  async findById(tenantId: string, id: string) {
    return db.query.subRecipes.findFirst({
      where: and(eq(subRecipes.id, id), eq(subRecipes.tenantId, tenantId)),
      with: relations,
    });
  },

  async findOwnedInventorySources(tenantId: string, branchId: string, ids: string[]) {
    if (!ids.length) return [];
    return db.query.inventoryItems.findMany({
      where: and(
        eq(inventoryItems.tenantId, tenantId),
        eq(inventoryItems.branchId, branchId),
        inArray(inventoryItems.id, ids),
      ),
      columns: { id: true, branchId: true, unit: true },
    });
  },

  async findOwnedSubRecipeSources(tenantId: string, branchId: string, ids: string[]) {
    if (!ids.length) return [];
    return db.query.subRecipes.findMany({
      where: and(
        eq(subRecipes.tenantId, tenantId),
        eq(subRecipes.branchId, branchId),
        inArray(subRecipes.id, ids),
      ),
      columns: { id: true, branchId: true, yieldUnit: true },
    });
  },

  async listGraph(tenantId: string) {
    const parents = await db.query.subRecipes.findMany({
      where: eq(subRecipes.tenantId, tenantId),
      columns: { id: true },
      with: { ingredients: { columns: { ingredientSubRecipeId: true } } },
    });
    return parents.map((parent) => ({
      id: parent.id,
      children: parent.ingredients.flatMap((ingredient) =>
        ingredient.ingredientSubRecipeId ? [ingredient.ingredientSubRecipeId] : [],
      ),
    }));
  },

  async create(data: {
    tenantId: string;
    branchId: string;
    name: string;
    yieldQuantity: number;
    yieldUnit: InventoryUnit;
    yieldPercent?: number | null;
    ingredients: SubRecipeIngredientWrite[];
  }) {
    return db.transaction(async (tx) => {
      const [created] = await tx.insert(subRecipes).values({
        tenantId: data.tenantId,
        branchId: data.branchId,
        name: data.name,
        yieldQuantity: String(data.yieldQuantity),
        yieldUnit: data.yieldUnit,
        yieldPercent: data.yieldPercent == null ? null : String(data.yieldPercent),
      }).returning();
      if (data.ingredients.length) {
        await tx.insert(subRecipeIngredients).values(data.ingredients.map((ingredient) => ({
          subRecipeId: created!.id,
          inventoryItemId: ingredient.inventoryItemId ?? null,
          ingredientSubRecipeId: ingredient.ingredientSubRecipeId ?? null,
          quantityRequired: String(ingredient.quantity),
          unit: ingredient.unit,
        })));
      }
      return tx.query.subRecipes.findFirst({ where: eq(subRecipes.id, created!.id), with: relations });
    });
  },

  async update(id: string, data: {
    branchId: string;
    name: string;
    yieldQuantity: number;
    yieldUnit: InventoryUnit;
    yieldPercent?: number | null;
    ingredients: SubRecipeIngredientWrite[];
  }) {
    return db.transaction(async (tx) => {
      await tx.update(subRecipes).set({
        branchId: data.branchId,
        name: data.name,
        yieldQuantity: String(data.yieldQuantity),
        yieldUnit: data.yieldUnit,
        yieldPercent: data.yieldPercent == null ? null : String(data.yieldPercent),
        updatedAt: new Date(),
      }).where(eq(subRecipes.id, id));
      await tx.delete(subRecipeIngredients).where(eq(subRecipeIngredients.subRecipeId, id));
      if (data.ingredients.length) {
        await tx.insert(subRecipeIngredients).values(data.ingredients.map((ingredient) => ({
          subRecipeId: id,
          inventoryItemId: ingredient.inventoryItemId ?? null,
          ingredientSubRecipeId: ingredient.ingredientSubRecipeId ?? null,
          quantityRequired: String(ingredient.quantity),
          unit: ingredient.unit,
        })));
      }
      return tx.query.subRecipes.findFirst({ where: eq(subRecipes.id, id), with: relations });
    });
  },

  async findDirectRecipeReferences(subRecipeId: string) {
    return db.query.recipes.findMany({
      where: eq(recipes.subRecipeId, subRecipeId),
      columns: { menuItemId: true, variantId: true, modifierOptionId: true },
    });
  },

  async delete(id: string) {
    await db.delete(subRecipes).where(eq(subRecipes.id, id));
  },
};
