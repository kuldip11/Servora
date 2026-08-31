import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/shared/lib/query-client";
import { notifyError, notifySuccess } from "@/shared/lib/notify";
import {
  billingService,
  type CollectPaymentInput,
} from "@/features/billing/services/billing.service";
import { orderKeys } from "@/features/orders/query-keys";
import { tableKeys } from "@/features/tables/query-keys";

export const useCollectPayment = () => {
  return useMutation({
    mutationFn: ({
      orderId,
      input,
    }: {
      orderId: string;
      input: CollectPaymentInput;
    }) => billingService.collectPayment(orderId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: tableKeys.all });
      notifySuccess("Payment recorded successfully");
    },
    onError: (err) => notifyError(err, "Payment failed"),
  });
};
