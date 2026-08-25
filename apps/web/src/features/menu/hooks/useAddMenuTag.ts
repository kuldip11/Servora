import { useMutation } from "@tanstack/react-query";
import { queryClient } from "../../../shared/lib/query-client";
import { notifyError, notifySuccess } from "../../../shared/lib/notify";
import { menuTagsService } from "../services/menu-tags.service";
import { menuKeys } from "../query-keys";

export function useAddMenuTag() {
  return useMutation({
    mutationFn: ({ name, color }: { name: string; color: string }) =>
      menuTagsService.create(name, color),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.tags() });
      notifySuccess("Tag created");
    },
    onError: (err) => notifyError(err, "Failed to create tag"),
  });
}
