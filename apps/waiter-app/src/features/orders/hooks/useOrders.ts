import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Order } from "@pos/types";
import { useRealtimeEvent } from "@/shared/lib/realtime";
import { fetchOrders } from "@/features/orders/api/orders";
import {
  orderKeys,
  ORDERS_POLL_INTERVAL_MS,
} from "@/features/orders/constants";
import {
  mergeRealtimeTicket,
  shouldApplyRealtime,
} from "@/features/orders/utils/realtime";

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
      if (!shouldApplyRealtime(current[index], order)) return current;
      const next = [...current];
      next[index] = order;
      return next;
    });
    qc.setQueryData<Order>(orderKeys.detail(order.id), (current) =>
      shouldApplyRealtime(current, order) ? order : current,
    );
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
              kitchenTickets: mergeRealtimeTicket(
                order.kitchenTickets ?? [],
                event.payload,
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
              kitchenTickets: mergeRealtimeTicket(
                current.kitchenTickets ?? [],
                event.payload,
              ),
            }
          : current,
    );
  });

  return query;
};
