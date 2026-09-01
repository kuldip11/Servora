import { queryOptions } from "@tanstack/react-query";
import {
  ordersService,
  type OrdersListFilters,
} from "./services/orders.service";
import { orderKeys } from "./query-keys";

export const ordersListQuery = (filters: OrdersListFilters) => {
  return queryOptions({
    queryKey: orderKeys.list(filters),
    queryFn: () => ordersService.list(filters),
  });
};

export const orderDetailQuery = (orderId: string) => {
  return queryOptions({
    queryKey: orderKeys.detail(orderId),
    queryFn: () => ordersService.detail(orderId),
  });
};
