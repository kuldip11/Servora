import { authService } from "../../features/auth/services/auth.service";
import { useAuthStore } from "../../store/auth";

/** Restores authentication from the persisted refresh token, keeping the access token memory-only. */
export async function bootstrapAuthSession(): Promise<void> {
  const refreshToken =
    typeof window === "undefined"
      ? null
      : window.localStorage.getItem("pos-refresh-token");
  if (!refreshToken) return;

  try {
    const result = await authService.refresh();
    useAuthStore.getState().setAuth(result);
  } catch {
    useAuthStore.getState().logout();
  }
}
