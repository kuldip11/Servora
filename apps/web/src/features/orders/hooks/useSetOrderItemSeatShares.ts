import { useMutation } from "@tanstack/react-query";
import { createOrdersApi } from "@pos/api-client";
import { apiClient } from "@/shared/lib/api-client";

const ordersApi = createOrdersApi(apiClient);
import { queryClient } from "@/shared/lib/query-client";
import { notifyError, notifySuccess } from "@/shared/lib/notify";
import { orderKeys } from "@/features/orders/query-keys";

export const useSetOrderItemSeatShares = (orderId: string) => {
  return useMutation({
    mutationFn: ({
      itemId,
      shares,
    }: {
      itemId: string;
      shares: Array<{ seatLabel: string; shareRatio: number }>;
    }) => ordersApi.setItemSeatShares(orderId, itemId, shares),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: orderKeys.detail(orderId),
      });
      notifySuccess("Shared item allocation saved");
    },
    onError: (error) =>
      notifyError(error, "Failed to save shared item allocation"),
  });
};
