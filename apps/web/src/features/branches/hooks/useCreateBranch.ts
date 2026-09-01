import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/shared/lib/query-client";
import { notifyError, notifySuccess } from "@/shared/lib/notify";
import {
  branchesService,
  type BranchFormInput,
} from "@/features/branches/services/branches.service";
import { branchKeys } from "@/features/branches/query-keys";

export const useCreateBranch = () => {
  return useMutation({
    mutationFn: (input: BranchFormInput) => branchesService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchKeys.all });
      notifySuccess("Branch created");
    },
    onError: (err) => notifyError(err, "Failed to create branch"),
  });
};
