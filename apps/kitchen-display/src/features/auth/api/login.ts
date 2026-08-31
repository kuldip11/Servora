import { createAuthApi, type AuthResponse } from "@pos/api-client";
import { apiClient } from "../../../shared/lib/api-client";

const authApi = createAuthApi(apiClient);
import type { AvailableMembership } from "@pos/types";
export async function login(
  email: string,
  password: string,
): Promise<AuthResponse> {
  return authApi.login({ email, password });
}
export async function fetchMemberships(): Promise<AvailableMembership[]> {
  return authApi.memberships();
}

export const logoutSession = authApi.logout;
