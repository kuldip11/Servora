import { useQuery } from "@tanstack/react-query";
import { menuTagsQuery } from "../query-options";

export function useMenuTags() {
  return useQuery(menuTagsQuery());
}
