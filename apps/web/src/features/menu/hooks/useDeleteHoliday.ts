import { useMutation } from "@tanstack/react-query";
import { queryClient } from "../../../shared/lib/query-client";
import { menuHolidaysService } from "../services/menu-holidays.service";
import { menuKeys } from "../query-keys";

export function useDeleteHoliday() {
  return useMutation({
    mutationFn: (id: string) => menuHolidaysService.remove(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: menuKeys.holidays() }),
  });
}
