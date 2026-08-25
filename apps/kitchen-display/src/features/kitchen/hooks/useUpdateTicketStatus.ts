import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@pos/ui';
import type { KitchenTicketStatus } from '@pos/types';
import { updateTicketStatus } from '../api/tickets';
import { KITCHEN_TICKETS_QUERY_KEY } from './useKitchenTickets';

export function useUpdateTicketStatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: KitchenTicketStatus }) =>
      updateTicketStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KITCHEN_TICKETS_QUERY_KEY });
      toast({ title: 'Ticket updated', tone: 'success' });
    },
    onError: () => toast({ title: 'Failed to update ticket', tone: 'danger' }),
  });
}
