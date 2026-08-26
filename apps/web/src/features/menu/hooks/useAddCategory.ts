import { useMutation } from "@tanstack/react-query";
import { queryClient } from "../../../shared/lib/query-client";
import { notifyError, notifySuccess } from "../../../shared/lib/notify";
import { menuItemsService } from "../services/menu-items.service";
import { menuKeys } from "../query-keys";

export function useAddCategory() {
  return useMutation({
    mutationFn: (name: string) => menuItemsService.addCategory(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.categories() });
      notifySuccess("Category added");
    },
    onError: (err) => notifyError(err, "Failed to add category"),
  });
}
