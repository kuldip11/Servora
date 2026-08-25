import { useMutation } from "@tanstack/react-query";
import { queryClient } from "../../../shared/lib/query-client";
import { notifyError } from "../../../shared/lib/notify";
import { menuItemsService } from "../services/menu-items.service";
import { menuKeys } from "../query-keys";

export function useToggleItemAvailability() {
  return useMutation({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
      menuItemsService.setAvailability(id, isAvailable),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: menuKeys.categories() }),
    onError: () => notifyError(undefined, "Failed to update availability"),
  });
}
