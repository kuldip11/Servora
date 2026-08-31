import { createApiClient, type TokenStorageAdapter } from "@pos/api-client";
import { STORAGE_KEYS } from "@/shared/constants/storage-keys";

const waiterStorageAdapter: TokenStorageAdapter = {
  getAccessToken: () => localStorage.getItem(STORAGE_KEYS.token),
  getTenantId: () => localStorage.getItem(STORAGE_KEYS.tenant),
  getBranchId: () => localStorage.getItem(STORAGE_KEYS.branch),
  setAccessToken: (accessToken) => {
    localStorage.setItem(STORAGE_KEYS.token, accessToken);
  },
  clear: () =>
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k)),
};

export const apiClient = createApiClient({
  baseURL: import.meta.env["VITE_API_URL"] ?? "/api",
  timeout: 15_000,
  storage: waiterStorageAdapter,
  onRefreshFailure: () => {
    waiterStorageAdapter.clear();
    window.location.reload();
  },
});
