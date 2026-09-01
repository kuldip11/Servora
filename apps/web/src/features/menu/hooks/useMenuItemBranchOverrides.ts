import { useQuery } from "@tanstack/react-query";
import { menuItemBranchOverridesQuery } from "@/features/menu/query-options";

export const useMenuItemBranchOverrides = (itemId: string) => {
  return useQuery(menuItemBranchOverridesQuery(itemId));
};
