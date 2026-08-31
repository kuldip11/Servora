import { useQuery } from "@tanstack/react-query";
import { inventoryService } from "@/features/inventory/services/inventory.service";

export const useInventoryTransactions = () => {
  return useQuery({
    queryKey: ["inventory", "transactions"],
    queryFn: () => inventoryService.transactions(),
  });
};
