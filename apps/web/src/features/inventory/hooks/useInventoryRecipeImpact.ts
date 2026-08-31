import { useQuery } from "@tanstack/react-query";
import { inventoryKeys } from "../query-keys";
import { inventoryService } from "../services/inventory.service";

export function useInventoryRecipeImpact(inventoryItemId: string | undefined) {
  return useQuery({
    queryKey: inventoryKeys.impact(inventoryItemId ?? "none"),
    queryFn: () => inventoryService.recipeImpact(inventoryItemId!),
    enabled: Boolean(inventoryItemId),
  });
}
