import { createAuthApi, type AuthResponse } from "@pos/api-client";
import { apiClient } from "@/shared/lib/api-client";
import { saveProfile, saveTokens } from "@/features/auth/storage";

const authApi = createAuthApi(apiClient);
export type { AuthResponse };

export const login = (
  email: string,
  password: string,
): Promise<AuthResponse> => {
  return authApi.login({ email, password });
};
export const fetchMemberships = authApi.memberships;
export const refreshSession = authApi.refresh;
export const fetchMe = authApi.me;
export const restoreSession = async (): Promise<boolean> => {
  const refreshed = await authApi.refresh();
  saveTokens(refreshed.accessToken);
  const user = await authApi.me();
  saveProfile(user);
  return true;
};

export const logoutSession = authApi.logout;
