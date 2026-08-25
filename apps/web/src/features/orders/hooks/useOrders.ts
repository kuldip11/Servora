import { useQuery } from "@tanstack/react-query";
import { ordersListQuery } from "../query-options";
import type { OrdersListFilters } from "../services/orders.service";

export function useOrders(filters: OrdersListFilters) {
  return useQuery(ordersListQuery(filters));
}
