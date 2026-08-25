import { useQuery } from "@tanstack/react-query";
import { menuTemplatesQuery } from "../query-options";

export function useMenuTemplates() {
  return useQuery(menuTemplatesQuery());
}
