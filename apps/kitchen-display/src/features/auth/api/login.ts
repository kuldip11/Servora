import { createAuthApi, type AuthResponse } from "@pos/api-client";
import { apiClient } from "@/shared/lib/api-client";
import { saveTokens } from "@/features/auth/storage";

const authApi = createAuthApi(apiClient);
import type { AvailableMembership } from "@pos/types";
export const login = async (
  email: string,
  password: string,
): Promise<AuthResponse> => {
  return authApi.login({ email, password });
};
export const fetchMemberships = async (): Promise<AvailableMembership[]> => {
  return authApi.memberships();
};

export const refreshSession = authApi.refresh;
export const restoreSession = async (): Promise<boolean> => {
  const refreshed = await authApi.refresh();
  saveTokens(refreshed.accessToken);
  await authApi.me();
  return true;
};
export const logoutSession = authApi.logout;
