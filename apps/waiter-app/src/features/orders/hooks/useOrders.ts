import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Order } from "@pos/types";
import { useRealtimeEvent } from "@/shared/lib/realtime";
import { fetchOrders } from "@/features/orders/api/orders";
import {
  orderKeys,
  ORDERS_POLL_INTERVAL_MS,
} from "@/features/orders/constants";

export const useOrders = () => {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: orderKeys.all,
    queryFn: fetchOrders,
    refetchInterval: ORDERS_POLL_INTERVAL_MS,
  });

  const upsert = (order: Order) => {
    qc.setQueryData<Order[]>(orderKeys.all, (current) => {
      if (!current) return [order];
      const index = current.findIndex((item) => item.id === order.id);
      if (index < 0) return [order, ...current];
      const next = [...current];
      next[index] = order;
      return next;
    });
    qc.setQueryData(orderKeys.detail(order.id), order);
  };

  useRealtimeEvent("order.created", (event) => upsert(event.payload));
  useRealtimeEvent("order.updated", (event) => upsert(event.payload));
  useRealtimeEvent("kitchen.ticket.updated", (event) => {
    qc.setQueryData<Order[]>(orderKeys.all, (current) =>
      current?.map((order) =>
        order.id !== event.payload.orderId
          ? order
          : {
              ...order,
              kitchenTickets: (order.kitchenTickets ?? []).map((ticket) =>
                ticket.id === event.payload.id ? event.payload : ticket,
              ),
            },
      ),
    );
    qc.setQueryData<Order>(
      orderKeys.detail(event.payload.orderId),
      (current) =>
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

  return query;
};
