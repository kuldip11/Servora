import { useQuery } from "@tanstack/react-query";
import { menuAllergensQuery } from "@/features/menu/query-options";

export const useMenuAllergens = () => {
  return useQuery(menuAllergensQuery());
};
