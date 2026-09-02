import { useQuery } from "@tanstack/react-query";
import { staffListQuery } from "@/features/staff/query-options";
import type { StaffListFilters } from "@pos/api-client";

export const useStaff = (filters: StaffListFilters = {}) => {
  return useQuery(staffListQuery(filters));
};
