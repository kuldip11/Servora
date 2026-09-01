import { useAuthStore } from "@/store/auth";

export const franchiseQueryContextKey = () => {
  return ["franchise", useAuthStore.getState().franchiseId] as const;
};

export const branchQueryContextKey = () => {
  const { franchiseId, branchId } = useAuthStore.getState();
  return ["branch-context", franchiseId, branchId] as const;
};

export const activeFranchiseId = () => {
  return useAuthStore.getState().franchiseId;
};

export const activeBranchId = () => {
  return useAuthStore.getState().branchId;
};
