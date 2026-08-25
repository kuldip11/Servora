/**
 * Menu recipes controller — thin handlers only. Auth/branch resolution
 * comes from `requireAuthPlugin` (applied in `recipes.route.ts`); business
 * rules live in `recipes.service.ts`.
 */
import type { AuthContext } from '../../../core/auth';
import type { InventoryUnit } from '@pos/types';
import { successResponse } from '../../../core/response';
import { recipesService, type RecipeIngredientInput } from './recipes.service';

export const recipesController = {
  async getItemRecipe(auth: AuthContext, itemId: string) {
    const recipe = await recipesService.getItemRecipe(auth, itemId);
    return successResponse(recipe);
  },

  async setItemRecipe(auth: AuthContext, itemId: string, ingredients: RecipeIngredientInput[]) {
    const recipe = await recipesService.setItemRecipe(auth, itemId, ingredients);
    return successResponse(recipe);
  },

  async deleteRecipeIngredient(auth: AuthContext, itemId: string, inventoryItemId: string) {
    await recipesService.deleteRecipeIngredient(auth, itemId, inventoryItemId);
    return successResponse(null);
  },

  async upsertRecipeIngredient(
    auth: AuthContext,
    itemId: string,
    inventoryItemId: string,
    quantity: number,
    unit: InventoryUnit,
    isOptional: boolean,
  ) {
    const row = await recipesService.upsertRecipeIngredient(auth, itemId, inventoryItemId, quantity, unit, isOptional);
    return successResponse(row);
  },

  async checkCanOrder(auth: AuthContext, itemId: string) {
    const result = await recipesService.checkCanOrder(auth, itemId);
    return successResponse(result);
  },
};
