import { useMutation } from "@tanstack/react-query";
import { queryClient } from "../../../shared/lib/query-client";
import { notifyError, notifySuccess } from "../../../shared/lib/notify";
import { extractApiError } from "../../../shared/lib/api-client";
import { ordersService } from "../services/orders.service";
import { orderKeys } from "../query-keys";

export function useVoidOrderItem(orderId: string) {
  return useMutation({
    mutationFn: ({ itemId, ...reason }: { itemId: string; cancellationReasonId?: string; reason?: string; approvalToken?: string }) =>
      ordersService.voidItem(orderId, itemId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      notifySuccess("Item voided");
    },
    onError: (error) => { if (extractApiError(error) === "Manager approval required") return; notifyError(error, "Failed to void item"); },
  });
}
