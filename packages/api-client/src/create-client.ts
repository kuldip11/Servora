import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import type { TokenStorageAdapter } from "./types";

export interface ApiClientConfig {
  /** Passed straight to axios.create — each app resolves its own env var. */
  baseURL: string;
  /** Passed straight to axios.create. */
  timeout: number;
  storage: TokenStorageAdapter;
  /**
   * Called whenever a refresh attempt fails to recover the session (no
   * refresh token available, or the refresh request itself errors). This is
   * where an app wires in whatever "you're logged out now" behavior it
   * needs — calling a store's `logout()`, clearing storage keys and
   * reloading, etc. `createApiClient` doesn't prescribe what that looks
   * like, only that it happens.
   */
  onRefreshFailure: () => void;
}

/**
 * Creates an axios instance configured with:
 *   1. A request interceptor that injects the Authorization header from
 *      the supplied storage adapter and sends active franchise/branch context
 *      as server-validated request selectors. Context is never part of the JWT.
 *   2. A response interceptor that, on a 401, attempts a single token
 *      refresh (queuing any other requests that 401 concurrently so they
 *      don't each trigger their own refresh), retries the original
 *      request, and calls `onRefreshFailure` if recovery isn't possible.
 *
 * This is a like-for-like extraction of what apps/web, apps/waiter-app, and
 * apps/kitchen-display each hand-rolled independently — behavior is
 * unchanged from all three, only where the code lives.
 */
export function createApiClient(config: ApiClientConfig): AxiosInstance {
  const { baseURL, timeout, storage, onRefreshFailure } = config;

  const clientConfig = {
    baseURL,
    headers: { "Content-Type": "application/json" },
    timeout,
  };

  const apiClient = axios.create(clientConfig);
  // Keep refresh isolated from the normal request/response interceptors so an
  // expired access token is never attached and a refresh 401 cannot recurse.
  // It still uses the exact same configured API origin as normal requests.
  const refreshClient = axios.create(clientConfig);

  apiClient.interceptors.request.use((requestConfig) => {
    const accessToken = storage.getAccessToken();

    if (accessToken)
      requestConfig.headers["Authorization"] = `Bearer ${accessToken}`;

    const tenantId = storage.getTenantId?.();
    const branchId = storage.getBranchId?.();

    if (tenantId) requestConfig.headers["X-Tenant-ID"] = tenantId;
    else delete requestConfig.headers["X-Tenant-ID"];

    if (branchId) requestConfig.headers["X-Branch-ID"] = branchId;
    else delete requestConfig.headers["X-Branch-ID"];

    return requestConfig;
  });

  // 401 → auto refresh, with a queue so concurrent requests that 401 at the
  // same time share a single refresh call instead of each starting their own.
  let isRefreshing = false;
  let failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (err: unknown) => void;
  }> = [];

  function processQueue(error: unknown, token: string | null) {
    failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
    failedQueue = [];
  }

  apiClient.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
      const original = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };
      if (
        error.response?.status !== 401 ||
        original._retry ||
        String(original.url ?? "").includes("/auth/refresh")
      ) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) =>
          failedQueue.push({ resolve, reject }),
        ).then((token) => {
          original.headers["Authorization"] = `Bearer ${token}`;
          return apiClient(original);
        });
      }

      original._retry = true;
      isRefreshing = true;
      const refreshToken = storage.getRefreshToken();

      if (!refreshToken) {
        isRefreshing = false;
        onRefreshFailure();
        return Promise.reject(error);
      }
      try {
        const res = await refreshClient.post("/auth/refresh", { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = res.data.data;
        storage.setTokens(accessToken, newRefreshToken);
        processQueue(null, accessToken);
        original.headers["Authorization"] = `Bearer ${accessToken}`;
        return apiClient(original);
      } catch (err) {
        processQueue(err, null);
        onRefreshFailure();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    },
  );

  return apiClient;
}
