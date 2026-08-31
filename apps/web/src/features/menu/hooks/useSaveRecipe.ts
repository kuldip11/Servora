import { useMutation } from "@tanstack/react-query";
import { queryClient } from "../../../shared/lib/query-client";
import { notifyError, notifySuccess } from "../../../shared/lib/notify";
import type { RecipeIngredientInput } from "@pos/types";
import { menuRecipesService } from "../services/menu-recipes.service";
import { menuKeys } from "../query-keys";
import { inventoryKeys } from "../../inventory/query-keys";

export function useSaveRecipe(itemId: string) {
  return useMutation({
    mutationFn: (ingredients: RecipeIngredientInput[]) =>
      menuRecipesService.save(itemId, ingredients),
    onSuccess: () => {
      notifySuccess("Recipe saved");
      queryClient.invalidateQueries({ queryKey: menuKeys.itemRecipe(itemId) });

      queryClient.invalidateQueries({ queryKey: inventoryKeys.items() });
    },
    onError: () => notifyError(undefined, "Failed to save recipe"),
  });
}
