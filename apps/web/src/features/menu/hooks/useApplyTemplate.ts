import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/shared/lib/query-client";
import { notifyError, notifySuccess } from "@/shared/lib/notify";
import {
  menuTemplatesService,
  type ApplyTemplateInput,
} from "@/features/menu/services/menu-templates.service";
import { menuKeys } from "@/features/menu/query-keys";

export const useApplyTemplate = () => {
  return useMutation({
    mutationFn: ({
      templateId,
      input,
    }: {
      templateId: string;
      input: ApplyTemplateInput;
    }) => menuTemplatesService.apply(templateId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.categories() });
    },
    onError: (err) => notifyError(err, "Failed to apply template"),
  });
};
