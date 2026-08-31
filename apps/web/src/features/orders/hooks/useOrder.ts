import { useQuery } from "@tanstack/react-query";
import { orderDetailQuery } from "@/features/orders/query-options";

export const useOrder = (orderId: string) => {
  return useQuery(orderDetailQuery(orderId));
};
