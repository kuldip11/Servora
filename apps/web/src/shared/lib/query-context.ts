import { useAuthStore } from "../../store/auth";

/**
 * Cache identity for tenant/franchise-scoped server state.
 * The database calls the concept a tenant; the product UI calls it a
 * franchise. Query keys use the actual franchise/tenant ID, never a
 * membership/access-record ID.
 */
export function franchiseQueryContextKey() {
  return ["franchise", useAuthStore.getState().franchiseId] as const;
}

/** Branch-scoped data must be separated by both franchise and branch. */
export function branchQueryContextKey() {
  const { franchiseId, branchId } = useAuthStore.getState();
  return ["branch-context", franchiseId, branchId] as const;
}

export function activeFranchiseId() {
  return useAuthStore.getState().franchiseId;
}

export function activeBranchId() {
  return useAuthStore.getState().branchId;
}
