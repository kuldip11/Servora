import { useMutation } from "@tanstack/react-query";
import { queryClient } from "../../../shared/lib/query-client";
import { notifyError, notifySuccess } from "../../../shared/lib/notify";
import {
  menuTemplatesService,
  type SaveTemplateInput,
} from "../services/menu-templates.service";
import { menuKeys } from "../query-keys";

export function useSaveTemplateFromCategory() {
  return useMutation({
    mutationFn: ({
      categoryId,
      input,
    }: {
      categoryId: string;
      input: SaveTemplateInput;
    }) => menuTemplatesService.saveFromCategory(categoryId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.templates() });
      notifySuccess("Template saved");
    },
    onError: (err) => notifyError(err, "Failed to save template"),
  });
}
