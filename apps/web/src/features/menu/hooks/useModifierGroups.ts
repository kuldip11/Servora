import { useQuery } from "@tanstack/react-query";
import { modifierGroupsQuery } from "@/features/menu/query-options";

export const useModifierGroups = () => {
  return useQuery(modifierGroupsQuery());
};
