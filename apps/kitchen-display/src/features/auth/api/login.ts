import { apiClient } from "../../../shared/lib/api-client";
import type { AvailableMembership, User } from "@pos/types";
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}
export async function login(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const res = await apiClient.post("/auth/login", { email, password });
  return res.data.data;
}
export async function fetchMemberships(): Promise<AvailableMembership[]> {
  const res = await apiClient.get("/auth/memberships");
  return res.data.data;
}
