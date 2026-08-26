import { useQuery } from "@tanstack/react-query";
import { modifierGroupsQuery } from "../query-options";

export function useModifierGroups() {
  return useQuery(modifierGroupsQuery());
}
