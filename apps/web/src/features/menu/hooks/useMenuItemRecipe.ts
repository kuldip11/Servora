import { useQuery } from "@tanstack/react-query";
import { menuItemRecipeQuery } from "@/features/menu/query-options";

export const useMenuItemRecipe = (itemId: string) => {
  return useQuery(menuItemRecipeQuery(itemId));
};
