import { useQuery } from "@tanstack/react-query";
import { menuTagsQuery } from "@/features/menu/query-options";

export const useMenuTags = () => {
  return useQuery(menuTagsQuery());
};
