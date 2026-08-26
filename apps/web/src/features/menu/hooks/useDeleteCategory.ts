import { useMutation } from "@tanstack/react-query";
import { queryClient } from "../../../shared/lib/query-client";
import { notifyError, notifySuccess } from "../../../shared/lib/notify";
import { menuItemsService } from "../services/menu-items.service";
import { menuKeys } from "../query-keys";

export function useDeleteCategory() {
  return useMutation({
    mutationFn: (id: string) => menuItemsService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.categories() });
      notifySuccess("Category removed");
    },
    onError: (err) => notifyError(err, "Failed to remove category"),
  });
}
