import { createMenuApi } from "@pos/api-client";
import { apiClient } from "../../../shared/lib/api-client";

const menuApi = createMenuApi(apiClient);
import type { Recipe, RecipeIngredientInput } from "@pos/types";


export const menuRecipesService = {
  async get(itemId: string): Promise<Recipe[]> {
    return menuApi.getItemRecipes<Recipe>(itemId);
  },

  async save(
    itemId: string,
    ingredients: RecipeIngredientInput[],
  ): Promise<void> {
    await menuApi.saveItemRecipes(itemId, ingredients);
  },
};
