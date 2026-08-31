import { createAuthApi, type AuthResponse } from "@pos/api-client";
import { apiClient } from "@/shared/lib/api-client";

const authApi = createAuthApi(apiClient);
export type { AuthResponse };

export const login = (
  email: string,
  password: string,
): Promise<AuthResponse> => {
  return authApi.login({ email, password });
};
export const fetchMemberships = authApi.memberships;

export const logoutSession = authApi.logout;
