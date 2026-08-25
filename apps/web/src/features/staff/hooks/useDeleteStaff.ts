import { useMutation } from "@tanstack/react-query";
import { queryClient } from "../../../shared/lib/query-client";
import { notifyError, notifySuccess } from "../../../shared/lib/notify";
import { staffService } from "../services/staff.service";
import { staffKeys } from "../query-keys";

export function useDeleteStaff() {
  return useMutation({
    mutationFn: (id: string) => staffService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.list() });
      notifySuccess("Staff member removed");
    },
    onError: (err) => notifyError(err, "Failed to remove staff"),
  });
}
