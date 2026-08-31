import { useQuery } from "@tanstack/react-query";
import { staffListQuery } from "@/features/staff/query-options";

export const useStaff = () => {
  return useQuery(staffListQuery());
};
