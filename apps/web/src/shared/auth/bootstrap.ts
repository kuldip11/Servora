import { authService } from "@/features/auth/services/auth.service";
import { useAuthStore } from "@/store/auth";

export const bootstrapAuthSession = async (): Promise<void> => {
  try {
    const result = await authService.refresh();
    useAuthStore.getState().setAuth(result);
  } catch {
    useAuthStore.getState().logout();
  }
};
