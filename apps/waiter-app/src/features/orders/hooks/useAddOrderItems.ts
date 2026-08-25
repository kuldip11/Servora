import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@pos/ui";
import { addOrderItems, type AddOrderItemInput } from "../api/orders";
import { orderKeys } from "../constants";

interface Params {
  orderId: string;
  items: AddOrderItemInput[];
  notes?: string;
}

export function useAddOrderItems() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, items, notes }: Params) =>
      addOrderItems(orderId, items, notes),
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: orderKeys.all });
      qc.invalidateQueries({ queryKey: orderKeys.detail(variables.orderId) });
      toast({ title: "Sent to kitchen!", tone: "success" });
    },
    onError: (err: any) =>
      toast({
        title: err?.response?.data?.message ?? "Failed",
        tone: "danger",
      }),
  });
}
