import { createApiClient, type TokenStorageAdapter } from '@pos/api-client';
import { STORAGE_KEYS } from '../constants/storage-keys';

const kdsStorageAdapter: TokenStorageAdapter = {
  getAccessToken: () => sessionStorage.getItem(STORAGE_KEYS.token),
  getRefreshToken: () => sessionStorage.getItem(STORAGE_KEYS.refresh),
  getTenantId: () => sessionStorage.getItem(STORAGE_KEYS.tenant),
  getBranchId: () => sessionStorage.getItem(STORAGE_KEYS.branch),
  setTokens: (accessToken, refreshToken) => {
    sessionStorage.setItem(STORAGE_KEYS.token, accessToken);
    sessionStorage.setItem(STORAGE_KEYS.refresh, refreshToken);
  },
  clear: () => sessionStorage.clear(),
};

export const apiClient = createApiClient({
  baseURL: import.meta.env['VITE_API_URL'] ?? '/api',
  timeout: 15_000,
  storage: kdsStorageAdapter,
  onRefreshFailure: () => {
    kdsStorageAdapter.clear();
    window.location.reload();
  },
});
