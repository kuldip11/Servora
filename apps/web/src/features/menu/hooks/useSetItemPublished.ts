import { useMutation } from "@tanstack/react-query";
import { queryClient } from "../../../shared/lib/query-client";
import { notifyError, notifySuccess } from "../../../shared/lib/notify";
import { menuItemsService } from "../services/menu-items.service";
import { menuKeys } from "../query-keys";

export function useSetItemPublished() {
  return useMutation({
    mutationFn: ({ id, publish }: { id: string; publish: boolean }) =>
      menuItemsService.setPublished(id, publish),
    onSuccess: (_data, { publish }) => {
      queryClient.invalidateQueries({ queryKey: menuKeys.categories() });
      notifySuccess(publish ? "Item published" : "Moved to draft");
    },
    onError: (err) => notifyError(err, "Failed to update publish state"),
  });
}
