import { useRealtimeEvent } from "@/shared/lib/realtime";
import { queryClient } from "@/shared/lib/query-client";
import { orderKeys } from "@/features/orders/query-keys";
import type { Order } from "@pos/types";

const upsertOrder = (order: Order) => {
  const currentDetail = queryClient.getQueryData<Order>(
    orderKeys.detail(order.id),
  );
  if (
    !currentDetail ||
    new Date(currentDetail.updatedAt).getTime() <=
      new Date(order.updatedAt).getTime()
  ) {
    queryClient.setQueryData(orderKeys.detail(order.id), order);
  }
  // Page membership and totals can change on every order event. Refetching the
  // bounded pages is both safer and cheaper than mutating arbitrary cached pages.
  void queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
};

export const useOrdersRealtimeSync = () => {
  useRealtimeEvent("order.created", (event) => upsertOrder(event.payload));
  useRealtimeEvent("order.updated", (event) => upsertOrder(event.payload));

  useRealtimeEvent("kitchen.ticket.updated", (event) => {
    void queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    queryClient.setQueryData<Order>(
      orderKeys.detail(event.payload.orderId),
      (current) => {
        if (!current?.kitchenTickets) return current;
        const existing = current.kitchenTickets.find(
          (ticket) => ticket.id === event.payload.id,
        );
        if (
          existing &&
          new Date(existing.updatedAt).getTime() >
            new Date(event.payload.updatedAt).getTime()
        )
          return current;
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
