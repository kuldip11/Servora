import { useQuery } from "@tanstack/react-query";
import { menuSubRecipesService } from "@/features/menu/services/menu-sub-recipes.service";
import { branchQueryContextKey } from "@/shared/lib/query-context";

export const subRecipeQueryKey = () =>
  ["menu", ...branchQueryContextKey(), "sub-recipes"] as const;

export const useSubRecipes = () => {
  return useQuery({
    queryKey: subRecipeQueryKey(),
    queryFn: menuSubRecipesService.list,
  });
};
