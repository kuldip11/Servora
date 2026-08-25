import { apiClient } from "../../../shared/lib/api-client";
import type { Recipe, InventoryUnit } from "@pos/types";

export interface RecipeIngredientInput {
  inventoryItemId: string;
  quantity: number;
  unit: InventoryUnit;
  isOptional: boolean;
}

export const menuRecipesService = {
  async get(itemId: string): Promise<Recipe[]> {
    const res = await apiClient.get(`/menu/items/${itemId}/recipes`);
    return res.data.data;
  },

  async save(
    itemId: string,
    ingredients: RecipeIngredientInput[],
  ): Promise<void> {
    await apiClient.post(`/menu/items/${itemId}/recipes`, { ingredients });
  },
};
