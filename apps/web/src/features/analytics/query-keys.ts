import { branchQueryContextKey } from "../../shared/lib/query-context";

export const analyticsKeys = {
  all: ["analytics"] as const,
  dashboard: () =>
    [...analyticsKeys.all, ...branchQueryContextKey(), "dashboard"] as const,
};
