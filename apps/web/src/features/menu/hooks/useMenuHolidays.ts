import { useQuery } from "@tanstack/react-query";
import { menuHolidaysQuery } from "@/features/menu/query-options";

export const useMenuHolidays = () => {
  return useQuery(menuHolidaysQuery());
};
