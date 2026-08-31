import { branchQueryContextKey } from "../../shared/lib/query-context";

export const inventoryKeys = {
  all: ["inventory"] as const,
  items: () =>
    [...inventoryKeys.all, ...branchQueryContextKey(), "items"] as const,
  impact: (inventoryItemId: string) =>
    [...inventoryKeys.all, ...branchQueryContextKey(), "impact", inventoryItemId] as const,
};
