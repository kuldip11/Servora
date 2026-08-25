import { createApiClient, extractApiError, type TokenStorageAdapter } from '@pos/api-client';
import { useAuthStore } from '../../store/auth';
import { queryClient } from './query-client';

const webStorageAdapter: TokenStorageAdapter = {
  getAccessToken: () => useAuthStore.getState().accessToken,
  getRefreshToken: () => useAuthStore.getState().refreshToken,
  setTokens: (accessToken, refreshToken) => useAuthStore.getState().setTokens(accessToken, refreshToken),
  clear: () => {
    useAuthStore.getState().logout();
    queryClient.clear();
  },
  getTenantId: () => useAuthStore.getState().franchiseId,
  getBranchId: () => useAuthStore.getState().branchId,
};

export const apiClient = createApiClient({
  baseURL: import.meta.env['VITE_API_URL'] ?? '/api',
  timeout: 30_000,
  storage: webStorageAdapter,
  onRefreshFailure: () => webStorageAdapter.clear(),
});

export { extractApiError };
