import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import type { ApiResponse } from "@pos/types";

export type DomainHttpClient = Pick<AxiosInstance, "get" | "post" | "put" | "patch" | "delete">;

export async function voidDomainRequest(request: unknown): Promise<void> {
  await request;
}

function unwrap<T>(response: AxiosResponse<ApiResponse<T>>): T {
  return response.data.data;
}

export async function getDomainData<T>(
  client: DomainHttpClient,
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  return unwrap(
    config === undefined
      ? await client.get<ApiResponse<T>>(url)
      : await client.get<ApiResponse<T>>(url, config),
  );
}

export async function postDomainData<T>(
  client: DomainHttpClient,
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  if (config !== undefined) {
    return unwrap(await client.post<ApiResponse<T>>(url, body, config));
  }
  return unwrap(
    body === undefined
      ? await client.post<ApiResponse<T>>(url)
      : await client.post<ApiResponse<T>>(url, body),
  );
}

export async function putDomainData<T>(
  client: DomainHttpClient,
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  if (config !== undefined) {
    return unwrap(await client.put<ApiResponse<T>>(url, body, config));
  }
  return unwrap(
    body === undefined
      ? await client.put<ApiResponse<T>>(url)
      : await client.put<ApiResponse<T>>(url, body),
  );
}

export async function patchDomainData<T>(
  client: DomainHttpClient,
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  if (config !== undefined) {
    return unwrap(await client.patch<ApiResponse<T>>(url, body, config));
  }
  return unwrap(
    body === undefined
      ? await client.patch<ApiResponse<T>>(url)
      : await client.patch<ApiResponse<T>>(url, body),
  );
}

export async function deleteDomainData<T>(
  client: DomainHttpClient,
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  return unwrap(
    config === undefined
      ? await client.delete<ApiResponse<T>>(url)
      : await client.delete<ApiResponse<T>>(url, config),
  );
}
