import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/shared/lib/query-client";
import { notifyError, notifySuccess } from "@/shared/lib/notify";
import { ordersService } from "@/features/orders/services/orders.service";
import { orderKeys } from "@/features/orders/query-keys";

export const useUpdateTicketStatus = (orderId: string) => {
  return useMutation({
    mutationFn: ({ ticketId, status }: { ticketId: string; status: string }) =>
      ordersService.updateTicketStatus(ticketId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
      notifySuccess("Ticket updated");
    },
    onError: (err) => notifyError(err, "Failed to update ticket"),
  });
};
