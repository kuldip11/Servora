import { useMutation } from "@tanstack/react-query";
import { queryClient } from "../../../shared/lib/query-client";
import { notifyError, notifySuccess } from "../../../shared/lib/notify";
import {
  inventoryService,
  type StockUpdateInput,
} from "../services/inventory.service";
import { inventoryKeys } from "../query-keys";

export function useUpdateInventoryStock() {
  return useMutation({
    mutationFn: ({
      itemId,
      input,
    }: {
      itemId: string;
      input: StockUpdateInput;
    }) => inventoryService.updateStock(itemId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.items() });
      notifySuccess("Stock updated");
    },
    onError: (err) => notifyError(err, "Failed to update stock"),
  });
}
