import { useQuery } from "@tanstack/react-query";
import { inventoryService } from "../services/inventory.service";

export const wasteReasonKey = ["inventory", "waste-reasons"] as const;
export function useWasteReasons() {
  return useQuery({ queryKey: wasteReasonKey, queryFn: inventoryService.wasteReasons });
}
