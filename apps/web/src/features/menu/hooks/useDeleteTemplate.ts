import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/shared/lib/query-client";
import { notifySuccess } from "@/shared/lib/notify";
import { menuTemplatesService } from "@/features/menu/services/menu-templates.service";
import { menuKeys } from "@/features/menu/query-keys";

export const useDeleteTemplate = () => {
  return useMutation({
    mutationFn: (id: string) => menuTemplatesService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.templates() });
      notifySuccess("Template deleted");
    },
  });
};
