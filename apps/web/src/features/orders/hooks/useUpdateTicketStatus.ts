import { useMutation } from "@tanstack/react-query";
import { queryClient } from "../../../shared/lib/query-client";
import { notifyError, notifySuccess } from "../../../shared/lib/notify";
import { ordersService } from "../services/orders.service";
import { orderKeys } from "../query-keys";

export function useUpdateTicketStatus(orderId: string) {
  return useMutation({
    mutationFn: ({ ticketId, status }: { ticketId: string; status: string }) =>
      ordersService.updateTicketStatus(ticketId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
      notifySuccess("Ticket updated");
    },
    onError: (err) => notifyError(err, "Failed to update ticket"),
  });
}
