import { useMutation } from "@tanstack/react-query";
import { queryClient } from "../../../shared/lib/query-client";
import { notifyError, notifySuccess } from "../../../shared/lib/notify";
import { tablesService } from "../services/tables.service";
import { tableKeys } from "../query-keys";
import type { TableFormInput } from "../types";

export function useCreateTable() {
  return useMutation({
    mutationFn: (input: TableFormInput) => tablesService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tableKeys.all });
      notifySuccess("Table added");
    },
    onError: (err) => notifyError(err, "Failed to add table"),
  });
}
