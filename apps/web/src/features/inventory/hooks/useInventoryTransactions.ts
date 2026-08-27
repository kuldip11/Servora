import { useQuery } from "@tanstack/react-query";
import { inventoryService } from "../services/inventory.service";

export function useInventoryTransactions() {
  return useQuery({
    queryKey: ["inventory", "transactions"],
    queryFn: () => inventoryService.transactions(),
  });
}
