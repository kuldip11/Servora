import { useMutation } from "@tanstack/react-query";
import { queryClient } from "../../../shared/lib/query-client";
import { notifyError, notifySuccess } from "../../../shared/lib/notify";
import { menuItemsService } from "../services/menu-items.service";
import { menuKeys } from "../query-keys";

export function useRenameCategory() {
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      menuItemsService.renameCategory(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.categories() });
      notifySuccess("Category renamed");
    },
    onError: (err) => notifyError(err, "Failed to rename category"),
  });
}
