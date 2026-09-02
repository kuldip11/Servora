import { queryOptions } from "@tanstack/react-query";
import { inventoryService } from "./services/inventory.service";
import { inventoryKeys } from "./query-keys";
import type { InventoryListFilters } from "@pos/api-client";

export const inventoryItemsQuery = (filters: InventoryListFilters = {}) => {
  const hasFilters = Object.keys(filters).length > 0;
  return queryOptions({
    queryKey: hasFilters
      ? [...inventoryKeys.items(), filters]
      : inventoryKeys.items(),
    queryFn: () => inventoryService.list(filters),
  });
};

export const lowStockItemsQuery = () =>
  queryOptions({
    queryKey: [...inventoryKeys.items(), "low-stock"],
    queryFn: inventoryService.lowStock,
  });
