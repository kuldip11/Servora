import { useQuery } from "@tanstack/react-query";
import { menuCategoriesQuery } from "../query-options";

export function useMenuCategories(options?: { enabled?: boolean }) {
  return useQuery({
    ...menuCategoriesQuery(),
    ...(options?.enabled !== undefined && { enabled: options.enabled }),
  });
}
