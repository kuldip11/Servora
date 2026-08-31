import { useAuthStore } from "../../store/auth";

export function franchiseQueryContextKey() {
  return ["franchise", useAuthStore.getState().franchiseId] as const;
}

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
