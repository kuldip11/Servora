import { useMutation } from "@tanstack/react-query";
import { queryClient } from "../../../shared/lib/query-client";
import { notifyError } from "../../../shared/lib/notify";
import { staffService } from "../services/staff.service";
import { staffKeys } from "../query-keys";

export function useUpdateStaffStatus() {
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      staffService.updateStatus(id, status),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: staffKeys.list() }),
    onError: (err) => notifyError(err, "Failed to update staff status"),
  });
}
