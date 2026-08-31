import { useRealtimeEvent } from "@/shared/lib/realtime";
import { queryClient } from "@/shared/lib/query-client";
import { inventoryKeys } from "@/features/inventory/query-keys";
import type { InventoryItem } from "@pos/types";

export const useInventoryRealtimeSync = () => {
  useRealtimeEvent("inventory.low_stock", (event) => {
    queryClient.setQueryData<InventoryItem[]>(inventoryKeys.items(), (items) =>
      items?.map((item) =>
        item.id === event.payload.id ? event.payload : item,
      ),
    );
  });
};
