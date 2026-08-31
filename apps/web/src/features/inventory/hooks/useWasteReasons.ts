import { useQuery } from "@tanstack/react-query";
import { inventoryService } from "@/features/inventory/services/inventory.service";

export const wasteReasonKey = ["inventory", "waste-reasons"] as const;
export const useWasteReasons = () => {
  return useQuery({
    queryKey: wasteReasonKey,
    queryFn: inventoryService.wasteReasons,
  });
};
