import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/shared/lib/query-client";
import { notifyError, notifySuccess } from "@/shared/lib/notify";
import { tablesService } from "@/features/tables/services/tables.service";
import { tableKeys } from "@/features/tables/query-keys";

export const useRegenerateTableQr = () => {
  return useMutation({
    mutationFn: (id: string) => tablesService.regenerateQr(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tableKeys.all });
      notifySuccess("Table QR code regenerated");
    },
    onError: (err) => notifyError(err, "Failed to regenerate QR code"),
  });
};
