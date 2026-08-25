import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRealtimeEvent } from "../../../shared/lib/realtime";
import { fetchOrder } from "../api/orders";
import { orderKeys, ORDER_DETAIL_POLL_INTERVAL_MS } from "../constants";

export function useOrder(orderId: string | null) {
  const qc = useQueryClient();

  useRealtimeEvent("order.updated", () => {
    if (orderId) qc.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
  });
  useRealtimeEvent("kitchen.ticket.updated", () => {
    if (orderId) qc.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
  });

  return useQuery({
    queryKey: orderId ? orderKeys.detail(orderId) : orderKeys.detail(""),
    queryFn: () => fetchOrder(orderId!),
    enabled: !!orderId,
    refetchInterval: ORDER_DETAIL_POLL_INTERVAL_MS,
  });
}
