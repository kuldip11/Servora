import { useMutation } from "@tanstack/react-query";
import { queryClient } from "../../../shared/lib/query-client";
import { notifyError } from "../../../shared/lib/notify";
import { menuItemsService } from "../services/menu-items.service";
import { menuKeys } from "../query-keys";

export function useToggleItemAvailability() {
  return useMutation({
    mutationFn: ({
      id,
      isAvailable,
      reason,
    }: {
      id: string;
      isAvailable: boolean;
      reason?: string;
    }) =>
      isAvailable
        ? menuItemsService.clearManualAvailabilityOverride(id)
        : menuItemsService.setManualAvailabilityOverride(
            id,
            "OUT_OF_STOCK",
            reason ?? "Manual availability override",
          ),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: menuKeys.categories() }),
    onError: () => notifyError(undefined, "Failed to update availability"),
  });
}
