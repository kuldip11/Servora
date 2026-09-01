import { useQuery } from "@tanstack/react-query";
import { fetchCategories } from "@/features/menu/api/menu";

export const useMenuCategories = () => {
  return useQuery({
    queryKey: ["menu-categories"],
    queryFn: fetchCategories,
  });
};
