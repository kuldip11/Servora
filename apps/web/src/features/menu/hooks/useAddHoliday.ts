import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/shared/lib/query-client";
import { notifyError, notifySuccess } from "@/shared/lib/notify";
import {
  menuHolidaysService,
  type HolidayFormInput,
} from "@/features/menu/services/menu-holidays.service";
import { menuKeys } from "@/features/menu/query-keys";

export const useAddHoliday = () => {
  return useMutation({
    mutationFn: (input: HolidayFormInput) => menuHolidaysService.add(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.holidays() });
      notifySuccess("Holiday added");
    },
    onError: (err) => notifyError(err, "Failed to add holiday"),
  });
};
