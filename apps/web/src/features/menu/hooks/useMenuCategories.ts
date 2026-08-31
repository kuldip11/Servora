import { useQuery } from "@tanstack/react-query";
import { menuCategoriesQuery } from "@/features/menu/query-options";

export const useMenuCategories = (options?: { enabled?: boolean }) => {
  return useQuery({
    ...menuCategoriesQuery(),
    ...(options?.enabled !== undefined && { enabled: options.enabled }),
  });
};
