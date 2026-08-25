import { useQueryClient } from '@tanstack/react-query';
import { useRealtimeEvent, useConnectionStatus } from '../../../shared/lib/realtime';
import { KITCHEN_TICKETS_QUERY_KEY } from './useKitchenTickets';

export function useKitchenRealtime(): { connected: boolean } {
  const qc = useQueryClient();
  const connected = useConnectionStatus();

  useRealtimeEvent('kitchen.ticket.created', () => {
    qc.invalidateQueries({ queryKey: KITCHEN_TICKETS_QUERY_KEY });
  });
  useRealtimeEvent('kitchen.ticket.updated', () => {
    qc.invalidateQueries({ queryKey: KITCHEN_TICKETS_QUERY_KEY });
  });

  return { connected };
}
