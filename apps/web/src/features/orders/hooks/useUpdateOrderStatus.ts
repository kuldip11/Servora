import { useMutation } from "@tanstack/react-query";
import { queryClient } from "../../../shared/lib/query-client";
import { notifyError, notifySuccess } from "../../../shared/lib/notify";
import { ordersService } from "../services/orders.service";
import { orderKeys } from "../query-keys";
import { tableKeys } from "../../tables/query-keys";

export function useUpdateOrderStatus(orderId: string) {
  return useMutation({
    mutationFn: (input: string | { status: string; cancellationReasonId?: string; reason?: string }) => {
      if (typeof input === "string") return ordersService.updateStatus(orderId, input);
      const { status, ...reason } = input;
      return ordersService.updateStatus(orderId, status, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: tableKeys.all });
      notifySuccess("Order status updated");
    },
    onError: (err) => notifyError(err, "Failed to update status"),
  });
}
