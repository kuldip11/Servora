import { useQuery } from "@tanstack/react-query";
import { ordersListQuery } from "@/features/orders/query-options";
import type { OrdersListFilters } from "@/features/orders/services/orders.service";

export const useOrders = (filters: OrdersListFilters) => {
  return useQuery(ordersListQuery(filters));
};
