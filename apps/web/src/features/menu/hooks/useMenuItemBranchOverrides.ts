import { useQuery } from "@tanstack/react-query";
import { menuItemBranchOverridesQuery } from "../query-options";

export function useMenuItemBranchOverrides(itemId: string) {
  return useQuery(menuItemBranchOverridesQuery(itemId));
}
