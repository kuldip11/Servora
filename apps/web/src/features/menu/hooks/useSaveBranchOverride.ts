import { useMutation } from "@tanstack/react-query";
import { queryClient } from "../../../shared/lib/query-client";
import { notifyError, notifySuccess } from "../../../shared/lib/notify";
import {
  menuBranchOverridesService,
  type BranchOverrideFormInput,
} from "../services/menu-branch-overrides.service";
import { menuKeys } from "../query-keys";

export function useSaveBranchOverride(itemId: string) {
  return useMutation({
    mutationFn: ({
      branchId,
      input,
    }: {
      branchId: string;
      input: BranchOverrideFormInput;
    }) => menuBranchOverridesService.save(itemId, branchId, input),
    onSuccess: () => {
      notifySuccess("Branch override saved");
      queryClient.invalidateQueries({
        queryKey: menuKeys.branchOverrides(itemId),
      });
    },
    onError: (err) => notifyError(err, "Failed to save override"),
  });
}
