import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@pos/ui";
import { createOrder, type CreateOrderInput } from "../api/createOrder";
import { orderKeys } from "../constants";

function mutationErrorMessage(error: unknown, fallback: string): string {
  if (typeof error !== "object" || error === null || !("response" in error)) return fallback;
  const response = (error as { response?: { data?: { message?: unknown } } }).response;
  return typeof response?.data?.message === "string" ? response.data.message : fallback;
}

export function useCreateOrder() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateOrderInput) => createOrder(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orderKeys.all });
      qc.invalidateQueries({ queryKey: ["tables"] });
      toast({ title: "Order placed!", tone: "success" });
    },
    onError: (err: unknown) =>
      toast({
        title: mutationErrorMessage(err, "Failed"),
        tone: "danger",
      }),
  });
}
