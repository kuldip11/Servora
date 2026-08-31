import { createMenuApi } from "@pos/api-client";
import { apiClient } from "@/shared/lib/api-client";

const menuApi = createMenuApi(apiClient);

export const menuSubRecipesService = {
  list: menuApi.listSubRecipes,
  create: menuApi.createSubRecipe,
  update: menuApi.updateSubRecipe,
  remove: menuApi.removeSubRecipe,
};
