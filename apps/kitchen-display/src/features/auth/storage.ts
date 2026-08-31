import { STORAGE_KEYS } from "@/shared/constants/storage-keys";
export const saveTokens = (accessToken: string) => {
  sessionStorage.setItem(STORAGE_KEYS.token, accessToken);
};
export const clearTokens = () => {
  sessionStorage.removeItem(STORAGE_KEYS.token);
  sessionStorage.removeItem(STORAGE_KEYS.tenant);
  sessionStorage.removeItem(STORAGE_KEYS.branch);
};
export const saveContext = (franchiseId: string, branchId: string | null) => {
  sessionStorage.setItem(STORAGE_KEYS.tenant, franchiseId);
  if (branchId) sessionStorage.setItem(STORAGE_KEYS.branch, branchId);
  else sessionStorage.removeItem(STORAGE_KEYS.branch);
};
export const getToken = (): string | null => {
  return sessionStorage.getItem(STORAGE_KEYS.token);
};
export const logout = () => {
  Object.values(STORAGE_KEYS).forEach((key) => sessionStorage.removeItem(key));
};
