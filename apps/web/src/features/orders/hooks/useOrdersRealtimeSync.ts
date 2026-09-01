import { useRealtimeEvent } from "@/shared/lib/realtime";
import { queryClient } from "@/shared/lib/query-client";
import { orderKeys } from "@/features/orders/query-keys";
import type { Order } from "@pos/types";
import type { OrdersListFilters } from "@/features/orders/services/orders.service";

const matchesFilters = (order: Order, filters: OrdersListFilters) => {
  if (filters.status && order.status !== filters.status) return false;
  if (filters.type && order.type !== filters.type) return false;
  return true;
};

const upsertOrder = (order: Order) => {
  const currentDetail = queryClient.getQueryData<Order>(orderKeys.detail(order.id));
  if (!currentDetail || new Date(currentDetail.updatedAt).getTime() <= new Date(order.updatedAt).getTime()) {
    queryClient.setQueryData(orderKeys.detail(order.id), order);
  }
  for (const query of queryClient
    .getQueryCache()
    .findAll({ queryKey: orderKeys.lists() })) {
    const filters = (query.queryKey.at(-1) ?? {}) as OrdersListFilters;
    queryClient.setQueryData<Order[]>(query.queryKey, (current) => {
      if (!current) return current;
      const existing = current.find((item) => item.id === order.id);
      if (existing && new Date(existing.updatedAt).getTime() > new Date(order.updatedAt).getTime()) return current;
      const without = current.filter((item) => item.id !== order.id);
      return matchesFilters(order, filters) ? [order, ...without] : without;
    });
  }
};

export const useOrdersRealtimeSync = () => {
  useRealtimeEvent("order.created", (event) => upsertOrder(event.payload));
  useRealtimeEvent("order.updated", (event) => upsertOrder(event.payload));

  useRealtimeEvent("kitchen.ticket.updated", (event) => {
    queryClient.setQueryData<Order>(
      orderKeys.detail(event.payload.orderId),
      (current) => {
        if (!current?.kitchenTickets) return current;
        const existing = current.kitchenTickets.find((ticket) => ticket.id === event.payload.id);
        if (existing && new Date(existing.updatedAt).getTime() > new Date(event.payload.updatedAt).getTime()) return current;
        return {
          ...current,
          kitchenTickets: current.kitchenTickets.map((ticket) =>
            ticket.id === event.payload.id
              ? { ...ticket, ...event.payload }
              : ticket,
          ),
          updatedAt: event.payload.updatedAt,
        };
      },
    );
  });
};
