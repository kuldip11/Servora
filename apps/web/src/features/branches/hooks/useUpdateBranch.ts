import { useMutation } from "@tanstack/react-query";
import { queryClient } from "../../../shared/lib/query-client";
import { notifyError, notifySuccess } from "../../../shared/lib/notify";
import {
  branchesService,
  type BranchFormInput,
} from "../services/branches.service";
import { branchKeys } from "../query-keys";

export function useUpdateBranch() {
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: BranchFormInput }) =>
      branchesService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchKeys.all });
      notifySuccess("Branch updated");
    },
    onError: (err) => notifyError(err, "Failed to update branch"),
  });
}
