import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/shared/lib/query-client";
import { notifyError, notifySuccess } from "@/shared/lib/notify";
import { branchesService } from "@/features/branches/services/branches.service";
import { branchKeys } from "@/features/branches/query-keys";

export const useDeactivateBranch = () => {
  return useMutation({
    mutationFn: (id: string) => branchesService.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchKeys.all });
      notifySuccess("Branch deactivated");
    },
    onError: (err) => notifyError(err, "Failed to deactivate branch"),
  });
};
