import { authService } from "../../features/auth/services/auth.service";
import { useAuthStore } from "../../store/auth";

/** Restores authentication through the API refresh cookie; access tokens stay memory-only. */
export async function bootstrapAuthSession(): Promise<void> {
  try {
    const result = await authService.refresh();
    useAuthStore.getState().setAuth(result);
  } catch {
    useAuthStore.getState().logout();
  }
}
