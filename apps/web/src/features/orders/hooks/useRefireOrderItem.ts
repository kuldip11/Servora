import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/shared/lib/query-client";
import { notifyError, notifySuccess } from "@/shared/lib/notify";
import { ordersService } from "@/features/orders/services/orders.service";
import { orderKeys } from "@/features/orders/query-keys";

export const useRefireOrderItem = (orderId: string) => {
  return useMutation({
    mutationFn: ({
      itemId,
      reason,
      alsoCompOriginal,
    }: {
      itemId: string;
      reason: string;
      alsoCompOriginal: boolean;
    }) => ordersService.refireItem(orderId, itemId, reason, alsoCompOriginal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      notifySuccess("Item refired");
    },
    onError: (error) => notifyError(error, "Failed to refire item"),
  });
};
