import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/shared/lib/query-client";
import { notifyError, notifySuccess } from "@/shared/lib/notify";
import { inventoryService } from "@/features/inventory/services/inventory.service";
import { inventoryKeys } from "@/features/inventory/query-keys";
import { wasteReasonKey } from "./useWasteReasons";

export const useLogInventoryWaste = () => {
  return useMutation({
    mutationFn: ({
      itemId,
      quantity,
      wasteReasonId,
      notes,
    }: {
      itemId: string;
      quantity: number;
      wasteReasonId: string;
      notes?: string;
    }) =>
      inventoryService.logWaste(itemId, {
        quantity,
        wasteReasonId,
        ...(notes !== undefined ? { notes } : {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.items() });
      queryClient.invalidateQueries({
        queryKey: ["inventory", "transactions"],
      });
      notifySuccess("Waste logged");
    },
    onError: (error) => notifyError(error, "Could not log waste"),
  });
};

export const useCreateWasteReason = () => {
  return useMutation({
    mutationFn: inventoryService.createWasteReason,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: wasteReasonKey }),
    onError: (error) => notifyError(error, "Could not create waste reason"),
  });
};
