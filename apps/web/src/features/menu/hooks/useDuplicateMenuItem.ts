import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/shared/lib/query-client";
import { notifyError, notifySuccess } from "@/shared/lib/notify";
import { menuItemsService } from "@/features/menu/services/menu-items.service";
import { menuKeys } from "@/features/menu/query-keys";

export const useDuplicateMenuItem = () => {
  return useMutation({
    mutationFn: (id: string) => menuItemsService.duplicateItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.categories() });
      notifySuccess("Item duplicated");
    },
    onError: (err) => notifyError(err, "Failed to duplicate item"),
  });
};
