import { authService } from "@/features/auth/services/auth.service";
import { useAuthStore } from "@/store/auth";
import { restoreActiveContext } from "@/shared/auth/active-context";

export const bootstrapAuthSession = async (): Promise<void> => {
  try {
    const result = await authService.refresh();
    useAuthStore.getState().setAuth(result);
    try {
      const memberships = await authService.memberships();
      if (memberships?.length) await restoreActiveContext(memberships);
    } catch {
      // The refreshed account remains signed in; /business can recover context.
    }
  } catch {
    useAuthStore.getState().logout();
  }
};
