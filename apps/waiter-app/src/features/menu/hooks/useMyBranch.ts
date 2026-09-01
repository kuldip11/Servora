import { useQuery } from "@tanstack/react-query";
import { fetchMyBranch } from "@/features/menu/api/branch";

export const useMyBranch = () => {
  return useQuery({
    queryKey: ["my-branch"],
    queryFn: fetchMyBranch,
  });
};
