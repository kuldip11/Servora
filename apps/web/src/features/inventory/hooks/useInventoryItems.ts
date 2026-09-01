import { useQuery } from "@tanstack/react-query";
import { inventoryItemsQuery } from "@/features/inventory/query-options";

export const useInventoryItems = () => {
  return useQuery(inventoryItemsQuery());
};
