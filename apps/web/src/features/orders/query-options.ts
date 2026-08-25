import { queryOptions } from "@tanstack/react-query";
import {
  ordersService,
  type OrdersListFilters,
} from "./services/orders.service";
import { orderKeys } from "./query-keys";

export function ordersListQuery(filters: OrdersListFilters) {
  return queryOptions({
    queryKey: orderKeys.list(filters),
    queryFn: () => ordersService.list(filters),
  });
}

export function orderDetailQuery(orderId: string) {
  return queryOptions({
    queryKey: orderKeys.detail(orderId),
    queryFn: () => ordersService.detail(orderId),
  });
}
