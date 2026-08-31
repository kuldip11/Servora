import { useRealtimeEvent } from "../../../shared/lib/realtime";
import { queryClient } from "../../../shared/lib/query-client";
import { analyticsKeys } from "../query-keys";
import { orderKeys } from "../../orders/query-keys";

export function useDashboardRealtimeSync() {
  useRealtimeEvent("order.created", () => {
    queryClient.invalidateQueries({ queryKey: analyticsKeys.dashboard() });
    queryClient.invalidateQueries({ queryKey: orderKeys.all });
  });
  useRealtimeEvent("order.updated", () => {
    queryClient.invalidateQueries({ queryKey: orderKeys.all });
  });
}
