import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@pos/ui";
import { updateTicketStatus } from "../api/orders";
import { orderKeys } from "../constants";

export function useUpdateTicketStatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketId, status }: { ticketId: string; status: string }) =>
      updateTicketStatus(ticketId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orderKeys.all });
      qc.invalidateQueries({ queryKey: ["order"] });
      toast({ title: "Ticket updated", tone: "success" });
    },
    onError: (err: any) =>
      toast({
        title: err?.response?.data?.message ?? "Failed to update ticket",
        tone: "danger",
      }),
  });
}
