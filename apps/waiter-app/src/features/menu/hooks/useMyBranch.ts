import { useQuery } from "@tanstack/react-query";
import { fetchMyBranch } from "../api/branch";

export function useMyBranch() {
  return useQuery({
    queryKey: ["my-branch"],
    queryFn: fetchMyBranch,
  });
}
