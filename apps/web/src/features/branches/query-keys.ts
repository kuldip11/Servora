import { franchiseQueryContextKey } from "@/shared/lib/query-context";

export const branchKeys = {
  all: ["branches"] as const,
  list: () =>
    [...branchKeys.all, ...franchiseQueryContextKey(), "list"] as const,
};
