import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@pos/ui";
import { createOrder, type CreateOrderInput } from "../api/createOrder";
import { orderKeys } from "../constants";

export function useCreateOrder() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateOrderInput) => createOrder(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orderKeys.all });
      qc.invalidateQueries({ queryKey: ["tables"] });
      toast({ title: "Order placed!", tone: "success" });
    },
    onError: (err: any) =>
      toast({
        title: err?.response?.data?.message ?? "Failed",
        tone: "danger",
      }),
  });
}
