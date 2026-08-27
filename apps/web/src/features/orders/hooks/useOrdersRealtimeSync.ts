import { useRealtimeEvent } from "../../../shared/lib/realtime";
import { queryClient } from "../../../shared/lib/query-client";
import { orderKeys } from "../query-keys";
import type { Order } from "@pos/types";
import type { OrdersListFilters } from "../services/orders.service";

function matchesFilters(order: Order, filters: OrdersListFilters) {
  if (filters.status && order.status !== filters.status) return false;
  if (filters.type && order.type !== filters.type) return false;
  return true;
}

function upsertOrder(order: Order) {
  queryClient.setQueryData(orderKeys.detail(order.id), order);
  for (const query of queryClient.getQueryCache().findAll({ queryKey: orderKeys.lists() })) {
    const filters = (query.queryKey.at(-1) ?? {}) as OrdersListFilters;
    queryClient.setQueryData<Order[]>(query.queryKey, (current) => {
      if (!current) return current;
      const without = current.filter((item) => item.id !== order.id);
      return matchesFilters(order, filters) ? [order, ...without] : without;
    });
  }
}

export function useOrdersRealtimeSync() {
  useRealtimeEvent("order.created", (event) => upsertOrder(event.payload));
  useRealtimeEvent("order.updated", (event) => upsertOrder(event.payload));

  useRealtimeEvent("kitchen.ticket.updated", (event) => {
    queryClient.setQueryData<Order>(orderKeys.detail(event.payload.orderId), (current) => {
      if (!current?.kitchenTickets) return current;
      return {
        ...current,
        kitchenTickets: current.kitchenTickets.map((ticket) =>
          ticket.id === event.payload.id ? { ...ticket, ...event.payload } : ticket,
        ),
        updatedAt: event.payload.updatedAt,
      };
    });
  });
}
