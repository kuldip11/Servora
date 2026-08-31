import { useMutation } from "@tanstack/react-query";
import { apiClient } from "../../../shared/lib/api-client";
import { queryClient } from "../../../shared/lib/query-client";
import { notifyError, notifySuccess } from "../../../shared/lib/notify";
import { orderKeys } from "../query-keys";

export function useSetOrderItemSeatShares(orderId: string) {
  return useMutation({
    mutationFn: ({ itemId, shares }: { itemId: string; shares: Array<{ seatLabel: string; shareRatio: number }> }) =>
      apiClient.put(`/orders/${orderId}/items/${itemId}/seat-shares`, { shares }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
      notifySuccess("Shared item allocation saved");
    },
    onError: (error) => notifyError(error, "Failed to save shared item allocation"),
  });
}
