import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@pos/ui";
import { transferOrderTable } from "../api/orders";
import { orderKeys } from "../constants";

export function useTransferTable(orderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ newTableId, reason }: { newTableId: string; reason?: string }) =>
      transferOrderTable(orderId, newTableId, reason),
    onSuccess: (order) => {
      queryClient.setQueryData(orderKeys.detail(orderId), order);
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      toast({ title: "Table transferred", tone: "success" });
    },
    onError: () => toast({ title: "Failed to transfer table", tone: "danger" }),
  });
}
