import { useQuery } from "@tanstack/react-query";
import { menuItemSchedulesQuery } from "../query-options";

export function useMenuItemSchedules(itemId: string) {
  return useQuery(menuItemSchedulesQuery(itemId));
}
