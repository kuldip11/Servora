import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import type { TokenStorageAdapter } from "./types";

export interface ApiClientConfig {

  baseURL: string;

  timeout: number;
  storage: TokenStorageAdapter;

  onRefreshFailure: () => void;
}

export function createApiClient(config: ApiClientConfig): AxiosInstance {
  const { baseURL, timeout, storage, onRefreshFailure } = config;

  const clientConfig = {
    baseURL,
    headers: { "Content-Type": "application/json" },
    timeout,
    withCredentials: true,
  };

  const apiClient = axios.create(clientConfig);

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
      try {
        const res = await refreshClient.post("/auth/refresh");
        const { accessToken } = res.data.data;
        storage.setAccessToken(accessToken);
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
