import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/shared/lib/query-client";
import { menuHolidaysService } from "@/features/menu/services/menu-holidays.service";
import { menuKeys } from "@/features/menu/query-keys";

export const useDeleteHoliday = () => {
  return useMutation({
    mutationFn: (id: string) => menuHolidaysService.remove(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: menuKeys.holidays() }),
  });
};
