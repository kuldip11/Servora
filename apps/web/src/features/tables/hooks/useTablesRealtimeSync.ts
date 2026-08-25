import { useRealtimeEvent } from "../../../shared/lib/realtime";
import { queryClient } from "../../../shared/lib/query-client";
import { tableKeys } from "../query-keys";
import type { RestaurantTable } from "@pos/types";

/** Update the table list in-place instead of refetching the whole collection. */
export function useTablesRealtimeSync() {
  useRealtimeEvent("table.updated", (event) => {
    queryClient.setQueryData<RestaurantTable[]>(tableKeys.list(), (tables) =>
      tables?.map((table) =>
        table.id === event.payload.id ? event.payload : table,
      ),
    );
  });
}
