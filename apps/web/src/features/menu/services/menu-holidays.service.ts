import { createMenuApi } from "@pos/api-client";
import { apiClient } from "../../../shared/lib/api-client";

const menuApi = createMenuApi(apiClient);

export interface HolidayFormInput {
  name: string;
  holidayDate: string;
  region?: string | undefined;
}

export const menuHolidaysService = {
  list: menuApi.listHolidays,
  add(input: HolidayFormInput) {
    return menuApi.addHoliday({
      name: input.name,
      holidayDate: input.holidayDate,
      ...(input.region !== undefined && { region: input.region }),
    });
  },
  remove: menuApi.removeHoliday,
};
