import { useQuery } from "@tanstack/react-query";
import { orderDetailQuery } from "../query-options";

export function useOrder(orderId: string) {
  return useQuery(orderDetailQuery(orderId));
}
