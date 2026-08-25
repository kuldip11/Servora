import { useRealtimeEvent } from '../../../shared/lib/realtime';
import { queryClient } from '../../../shared/lib/query-client';
import { orderKeys } from '../query-keys';
import type { Order } from '@pos/types';

/**
 * Prefer targeted cache updates for realtime order events. List queries are
 * still invalidated because status/type filters may need membership changes,
 * but unrelated order-detail queries are not refetched.
 */
export function useOrdersRealtimeSync() {
  useRealtimeEvent('order.created', (event) => {
    queryClient.invalidateQueries({ queryKey: orderKeys.lists(), refetchType: 'active' });
    queryClient.setQueryData(orderKeys.detail(event.payload.id), event.payload);
  });

  useRealtimeEvent('order.updated', (event) => {
    queryClient.setQueryData<Order>(orderKeys.detail(event.payload.id), event.payload);
    queryClient.invalidateQueries({ queryKey: orderKeys.lists(), refetchType: 'active' });
  });

  useRealtimeEvent('kitchen.ticket.updated', (event) => {
    queryClient.setQueryData<Order>(orderKeys.detail(event.payload.orderId), (current) => {
      if (!current?.kitchenTickets) return current;
      return {
        ...current,
        kitchenTickets: current.kitchenTickets.map((ticket) =>
          ticket.id === event.payload.id ? event.payload : ticket,
        ),
        updatedAt: event.payload.updatedAt,
      };
    });
    queryClient.invalidateQueries({ queryKey: orderKeys.lists(), refetchType: 'active' });
  });
}
