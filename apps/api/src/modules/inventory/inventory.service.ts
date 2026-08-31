

import { inventoryRecipeService } from "./inventory-recipe.service";
import { inventoryStockService } from "./inventory-stock.service";

export type {
  CreateInventoryItemInput,
  InventoryOrderItemInput,
  RecipeNeedItemInput,
  UpdateStockInput,
} from "./inventory.types";
export { weightRecipeScale } from "./inventory-recipe.engine";

export const inventoryService = {
  ...inventoryStockService,
  ...inventoryRecipeService,
};
