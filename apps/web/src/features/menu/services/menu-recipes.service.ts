import { apiClient } from "../../../shared/lib/api-client";
import type { Recipe, RecipeIngredientInput } from "@pos/types";


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
