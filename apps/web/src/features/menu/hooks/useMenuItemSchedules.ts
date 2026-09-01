import { useQuery } from "@tanstack/react-query";
import { menuItemSchedulesQuery } from "@/features/menu/query-options";

export const useMenuItemSchedules = (itemId: string) => {
  return useQuery(menuItemSchedulesQuery(itemId));
};
