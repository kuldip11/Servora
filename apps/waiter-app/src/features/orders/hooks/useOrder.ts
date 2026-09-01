import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Order } from "@pos/types";
import { useRealtimeEvent } from "@/shared/lib/realtime";
import { fetchOrder } from "@/features/orders/api/orders";
import {
  orderKeys,
  ORDER_DETAIL_POLL_INTERVAL_MS,
} from "@/features/orders/constants";
import {
  mergeRealtimeTicket,
  shouldApplyRealtime,
} from "@/features/orders/utils/realtime";

export const useOrder = (orderId: string | null) => {
  const qc = useQueryClient();

  useRealtimeEvent("order.updated", (event) => {
    if (orderId && event.payload.id === orderId)
      qc.setQueryData<Order>(orderKeys.detail(orderId), (current) =>
        shouldApplyRealtime(current, event.payload) ? event.payload : current,
      );
  });
  useRealtimeEvent("order.created", (event) => {
    if (orderId && event.payload.id === orderId)
      qc.setQueryData<Order>(orderKeys.detail(orderId), (current) =>
        shouldApplyRealtime(current, event.payload) ? event.payload : current,
      );
  });
  useRealtimeEvent("kitchen.ticket.updated", (event) => {
    if (!orderId || event.payload.orderId !== orderId) return;
    qc.setQueryData<Order>(orderKeys.detail(orderId), (current) =>
      current
        ? {
            ...current,
            kitchenTickets: mergeRealtimeTicket(
              current.kitchenTickets ?? [],
              event.payload,
            ),
          }
        : current,
    );
  });

  return useQuery({
    queryKey: orderId ? orderKeys.detail(orderId) : orderKeys.detail(""),
    queryFn: () => fetchOrder(orderId!),
    enabled: !!orderId,
    refetchInterval: ORDER_DETAIL_POLL_INTERVAL_MS,
  });
};
