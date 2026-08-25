import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRealtimeEvent } from '../../../shared/lib/realtime';
import { fetchOrders } from '../api/orders';
import { orderKeys, ORDERS_POLL_INTERVAL_MS } from '../constants';

export function useOrders() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: orderKeys.all,
    queryFn: fetchOrders,
    // Push updates from @pos/realtime invalidate this on order/ticket
    // changes below; the interval stays as a fallback for the (now rarer)
    // gap while the socket is reconnecting — same belt-and-suspenders
    // pattern kitchen-display already used before this app had a socket.
    refetchInterval: ORDERS_POLL_INTERVAL_MS,
  });

  useRealtimeEvent('order.created', () => {
    qc.invalidateQueries({ queryKey: orderKeys.all });
  });
  useRealtimeEvent('order.updated', () => {
    qc.invalidateQueries({ queryKey: orderKeys.all });
    qc.invalidateQueries({ queryKey: ['order'] });
  });
  useRealtimeEvent('kitchen.ticket.updated', () => {
    qc.invalidateQueries({ queryKey: orderKeys.all });
    qc.invalidateQueries({ queryKey: ['order'] });
  });

  return query;
}
