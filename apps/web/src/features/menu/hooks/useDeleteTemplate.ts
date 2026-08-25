import { useMutation } from "@tanstack/react-query";
import { queryClient } from "../../../shared/lib/query-client";
import { notifySuccess } from "../../../shared/lib/notify";
import { menuTemplatesService } from "../services/menu-templates.service";
import { menuKeys } from "../query-keys";

export function useDeleteTemplate() {
  return useMutation({
    mutationFn: (id: string) => menuTemplatesService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.templates() });
      notifySuccess("Template deleted");
    },
  });
}
