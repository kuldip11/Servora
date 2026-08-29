import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Order } from "@pos/types";
import { useRealtimeEvent } from "../../../shared/lib/realtime";
import { fetchOrder } from "../api/orders";
import { orderKeys, ORDER_DETAIL_POLL_INTERVAL_MS } from "../constants";

export function useOrder(orderId: string | null) {
  const qc = useQueryClient();

  useRealtimeEvent("order.updated", (event) => {
    if (orderId && event.payload.id === orderId)
      qc.setQueryData(orderKeys.detail(orderId), event.payload);
  });
  useRealtimeEvent("order.created", (event) => {
    if (orderId && event.payload.id === orderId)
      qc.setQueryData(orderKeys.detail(orderId), event.payload);
  });
  useRealtimeEvent("kitchen.ticket.updated", (event) => {
    if (!orderId || event.payload.orderId !== orderId) return;
    qc.setQueryData<Order>(orderKeys.detail(orderId), (current) =>
      current
        ? {
            ...current,
            kitchenTickets: (current.kitchenTickets ?? []).map((ticket) =>
              ticket.id === event.payload.id ? event.payload : ticket,
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
}
