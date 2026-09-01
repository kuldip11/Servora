import { queryOptions } from "@tanstack/react-query";
import { inventoryService } from "./services/inventory.service";
import { inventoryKeys } from "./query-keys";

export const inventoryItemsQuery = () => {
  return queryOptions({
    queryKey: inventoryKeys.items(),
    queryFn: inventoryService.list,
  });
};
