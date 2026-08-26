import { useMutation } from "@tanstack/react-query";
import { queryClient } from "../../../shared/lib/query-client";
import { notifyError, notifySuccess } from "../../../shared/lib/notify";
import { menuBranchOverridesService } from "../services/menu-branch-overrides.service";
import { menuKeys } from "../query-keys";

export function useResetBranchOverride(itemId: string) {
  return useMutation({
    mutationFn: (branchId: string) =>
      menuBranchOverridesService.reset(itemId, branchId),
    onSuccess: () => {
      notifySuccess("Reset to default");
      queryClient.invalidateQueries({
        queryKey: menuKeys.branchOverrides(itemId),
      });
    },
    onError: () => notifyError(undefined, "Failed to reset"),
  });
}
