import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@pos/ui";
import { addOrderItems, type AddOrderComboInput, type AddOrderItemInput } from "../api/orders";
import { orderKeys } from "../constants";

interface Params {
  orderId: string;
  items: AddOrderItemInput[];
  combos: AddOrderComboInput[];
  notes?: string;
  couponCode?: string;
  promotionIds?: string[];
}

export function useAddOrderItems() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, items, combos, notes, couponCode, promotionIds }: Params) =>
      addOrderItems(orderId, items, combos, notes, {
        ...(couponCode ? { couponCode } : {}),
        ...(promotionIds?.length ? { promotionIds } : {}),
      }),
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: orderKeys.all });
      qc.invalidateQueries({ queryKey: orderKeys.detail(variables.orderId) });
      toast({ title: "Sent to kitchen!", tone: "success" });
    },
    onError: (err: unknown) => {
      const message = typeof err === "object" && err !== null && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      toast({
        title: message ?? "Failed",
        tone: "danger",
      });
    },
  });
}
