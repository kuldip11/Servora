import { createApiClient, type TokenStorageAdapter } from '@pos/api-client';
import { STORAGE_KEYS } from '../constants/storage-keys';

const waiterStorageAdapter: TokenStorageAdapter = {
  getAccessToken: () => localStorage.getItem(STORAGE_KEYS.token),
  getRefreshToken: () => localStorage.getItem(STORAGE_KEYS.refresh),
  getTenantId: () => localStorage.getItem(STORAGE_KEYS.tenant),
  getBranchId: () => localStorage.getItem(STORAGE_KEYS.branch),
  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem(STORAGE_KEYS.token, accessToken);
    localStorage.setItem(STORAGE_KEYS.refresh, refreshToken);
  },
  clear: () => Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k)),
};

export const apiClient = createApiClient({
  baseURL: import.meta.env['VITE_API_URL'] ?? '/api',
  timeout: 15_000,
  storage: waiterStorageAdapter,
  onRefreshFailure: () => {
    waiterStorageAdapter.clear();
    window.location.reload();
  },
});
