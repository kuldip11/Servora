const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

const API_URL = import.meta.env.DEV
  ? ""
  : (configuredApiUrl ?? "").replace(/\/$/, "");

export async function request<T>(
  path: string,
  init?: RequestInit,
  sessionToken?: string,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(sessionToken ? { "X-Customer-Session": sessionToken } : {}),
      ...(init?.headers ?? {}),
    },
  });

  const body = await response.json().catch(() => null);
  if (!response.ok || body?.success === false) {
    throw new Error(body?.message ?? "Customer API request failed");
  }
  return body.data as T;
}
