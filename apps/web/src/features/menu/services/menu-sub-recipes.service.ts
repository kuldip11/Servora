import { apiClient } from "../../../shared/lib/api-client";
import type { SubRecipe, SubRecipeInput } from "@pos/types";


export const menuSubRecipesService = {
  async list(): Promise<SubRecipe[]> {
    const res = await apiClient.get("/menu/sub-recipes/");
    return res.data.data;
  },
  async create(input: SubRecipeInput): Promise<SubRecipe> {
    const res = await apiClient.post("/menu/sub-recipes/", input);
    return res.data.data;
  },
  async update(id: string, input: SubRecipeInput): Promise<SubRecipe> {
    const res = await apiClient.put(`/menu/sub-recipes/${id}`, input);
    return res.data.data;
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/menu/sub-recipes/${id}`);
  },
};
