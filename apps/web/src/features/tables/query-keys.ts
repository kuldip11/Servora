import { branchQueryContextKey } from "../../shared/lib/query-context";

export const tableKeys = {
  all: ["tables"] as const,
  list: () => [...tableKeys.all, ...branchQueryContextKey(), "list"] as const,
};
