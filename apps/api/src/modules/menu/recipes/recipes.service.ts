/**
 * Menu recipes service — orchestrates `recipes.repository.ts` and applies
 * the business rules that used to live inline in the monolithic
 * `menu/repository.ts`: item/tenant ownership checks, cross-tenant
 * ingredient validation, and the "can this item currently be made"
 * inventory check.
 */
import type { AuthContext } from '../../../core/auth';
import type { InventoryUnit } from '@pos/types';
import { recipesRepository } from './recipes.repository';
import { requirePermission } from '../../../core/auth';
import { assertMenuResourceBranch } from '../menu-authorization';
import { itemNotFound, inventoryItemNotFound } from './recipes.errors';

export interface RecipeIngredientInput {
  inventoryItemId: string;
  quantity: number;
  unit: InventoryUnit;
  isOptional?: boolean | undefined;
}

export interface CanOrderResult {
  canOrder: boolean;
  missingIngredients: Array<{ inventoryItemId: string; name: string; required: number; available: number; unit: InventoryUnit }>;
}

export const recipesService = {
  async getItemRecipe(auth: AuthContext, itemId: string) {
    const item = await recipesRepository.findItem(auth.tenantId, itemId);
    if (!item) throw itemNotFound(itemId);
    requirePermission(auth, 'menu:read');
    assertMenuResourceBranch(auth, item.branchId, { allowShared: true });
    return recipesRepository.getItemRecipe(itemId);
  },

  // Replaces the item's full ingredient list — simpler for the
  // recipe-builder UI than diffing add/remove, and avoids stale ingredient
  // rows if the caller forgets to clean up.
  async setItemRecipe(auth: AuthContext, itemId: string, ingredients: RecipeIngredientInput[]) {
    const item = await recipesRepository.findItem(auth.tenantId, itemId);
    if (!item) throw itemNotFound(itemId);
    requirePermission(auth, 'menu:update');
    assertMenuResourceBranch(auth, item.branchId);

    if (ingredients.length) {
      const invIds = ingredients.map((i) => i.inventoryItemId);
      const ownedSet = await recipesRepository.findOwnedInventoryItemIds(auth.tenantId, invIds);
      const missing = invIds.filter((id) => !ownedSet.has(id));
      if (missing.length) throw inventoryItemNotFound(missing);
    }

    return recipesRepository.replaceRecipe(
      itemId,
      ingredients.map((i) => ({ ...i, isOptional: i.isOptional ?? false })),
    );
  },

  async deleteRecipeIngredient(auth: AuthContext, itemId: string, inventoryItemId: string) {
    const item = await recipesRepository.findItem(auth.tenantId, itemId);
    if (!item) throw itemNotFound(itemId);
    requirePermission(auth, 'menu:update');
    assertMenuResourceBranch(auth, item.branchId);
    await recipesRepository.deleteRecipeIngredient(itemId, inventoryItemId);
  },

  async upsertRecipeIngredient(
    auth: AuthContext,
    itemId: string,
    inventoryItemId: string,
    quantity: number,
    unit: InventoryUnit,
    isOptional: boolean,
  ) {
    const item = await recipesRepository.findItem(auth.tenantId, itemId);
    if (!item) throw itemNotFound(itemId);
    requirePermission(auth, 'menu:update');
    assertMenuResourceBranch(auth, item.branchId);
    const inv = await recipesRepository.findInventoryItem(auth.tenantId, inventoryItemId);
    if (!inv) throw inventoryItemNotFound([inventoryItemId]);

    return recipesRepository.upsertRecipeIngredient(itemId, inventoryItemId, quantity, unit, isOptional);
  },

  // Checks whether ONE unit of this item can currently be made — i.e.
  // every required (non-optional) ingredient has enough stock for its
  // per-unit quantity. Items with recipe deduction turned off, or with no
  // recipe at all, are always orderable from an inventory standpoint.
  async checkCanOrder(auth: AuthContext, itemId: string): Promise<CanOrderResult> {
    const item = await recipesRepository.findItem(auth.tenantId, itemId);
    if (!item) return { canOrder: true, missingIngredients: [] };
    requirePermission(auth, 'menu:read');
    assertMenuResourceBranch(auth, item.branchId);
    if (!item.enableRecipeDeduction) return { canOrder: true, missingIngredients: [] };

    const ingredients = await recipesRepository.getRequiredIngredients(itemId);

    const missingIngredients = ingredients
      .filter((ing) => parseFloat(ing.inventoryItem.currentStock) < parseFloat(ing.quantityRequired))
      .map((ing) => ({
        inventoryItemId: ing.inventoryItemId,
        name: ing.inventoryItem.name,
        required: parseFloat(ing.quantityRequired),
        available: parseFloat(ing.inventoryItem.currentStock),
        unit: ing.unit,
      }));

    return { canOrder: missingIngredients.length === 0, missingIngredients };
  },
};
