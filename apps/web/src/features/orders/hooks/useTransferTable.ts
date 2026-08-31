import { useMutation } from "@tanstack/react-query";
import { queryClient } from "../../../shared/lib/query-client";
import { notifyError, notifySuccess } from "../../../shared/lib/notify";
import { tableKeys } from "../../tables/query-keys";
import { orderKeys } from "../query-keys";
import { ordersService } from "../services/orders.service";

export function useTransferTable() {
  return useMutation({
    mutationFn: ({ orderId, newTableId, reason }: { orderId: string; newTableId: string; reason?: string }) =>
      ordersService.transferTable(orderId, newTableId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tableKeys.all });
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      notifySuccess("Table transferred");
    },
    onError: (error) => notifyError(error, "Failed to transfer table"),
  });
}
