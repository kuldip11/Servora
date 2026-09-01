import { useQuery } from "@tanstack/react-query";
import { menuTemplatesQuery } from "@/features/menu/query-options";

export const useMenuTemplates = () => {
  return useQuery(menuTemplatesQuery());
};
