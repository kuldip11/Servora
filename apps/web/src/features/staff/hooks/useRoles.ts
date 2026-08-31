import { useQuery } from "@tanstack/react-query";
import { rolesListQuery } from "@/features/staff/query-options";

export const useRoles = () => {
  return useQuery(rolesListQuery());
};
