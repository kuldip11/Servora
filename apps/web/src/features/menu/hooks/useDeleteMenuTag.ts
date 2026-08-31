import { useMutation } from "@tanstack/react-query";
import { queryClient } from "../../../shared/lib/query-client";
import { menuTagsService } from "../services/menu-tags.service";
import { menuKeys } from "../query-keys";

export function useDeleteMenuTag() {
  return useMutation({
    mutationFn: (id: string) => menuTagsService.remove(id),
    onSuccess: () => {

      queryClient.invalidateQueries({ queryKey: menuKeys.tags() });
      queryClient.invalidateQueries({ queryKey: menuKeys.categories() });
    },
  });
}
