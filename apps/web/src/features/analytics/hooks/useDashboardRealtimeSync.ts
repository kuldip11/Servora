import { useRealtimeEvent } from "@/shared/lib/realtime";
import { queryClient } from "@/shared/lib/query-client";
import { analyticsKeys } from "@/features/analytics/query-keys";
import { orderKeys } from "@/features/orders/query-keys";

export const useDashboardRealtimeSync = () => {
  useRealtimeEvent("order.created", () => {
    queryClient.invalidateQueries({ queryKey: analyticsKeys.dashboard() });
    queryClient.invalidateQueries({ queryKey: orderKeys.all });
  });
  useRealtimeEvent("order.updated", () => {
    queryClient.invalidateQueries({ queryKey: orderKeys.all });
  });
};
