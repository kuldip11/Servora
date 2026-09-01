import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/shared/lib/query-client";
import { notifyError, notifySuccess } from "@/shared/lib/notify";
import { tableKeys } from "@/features/tables/query-keys";
import { orderKeys } from "@/features/orders/query-keys";
import { ordersService } from "@/features/orders/services/orders.service";

export const useTransferTable = () => {
  return useMutation({
    mutationFn: ({
      orderId,
      newTableId,
      reason,
    }: {
      orderId: string;
      newTableId: string;
      reason?: string;
    }) => ordersService.transferTable(orderId, newTableId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tableKeys.all });
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      notifySuccess("Table transferred");
    },
    onError: (error) => notifyError(error, "Failed to transfer table"),
  });
};
