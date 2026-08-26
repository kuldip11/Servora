import { useMutation } from "@tanstack/react-query";
import { queryClient } from "../../../shared/lib/query-client";
import { notifyError } from "../../../shared/lib/notify";
import { tablesService } from "../services/tables.service";
import { tableKeys } from "../query-keys";

export function useUpdateTableStatus() {
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      tablesService.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tableKeys.all }),
    onError: (err) => notifyError(err, "Failed to update status"),
  });
}
