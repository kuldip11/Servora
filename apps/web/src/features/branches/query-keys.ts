import { franchiseQueryContextKey } from "../../shared/lib/query-context";

// Single source of truth for every TanStack Query key this feature uses.
export const branchKeys = {
  all: ["branches"] as const,
  list: () =>
    [...branchKeys.all, ...franchiseQueryContextKey(), "list"] as const,
};
