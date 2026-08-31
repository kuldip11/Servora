import { beforeEach, describe, expect, it, vi } from "vitest";
import { bootstrapAuthSession } from "@/shared/auth/bootstrap";
import { authService } from "@/features/auth/services/auth.service";
import { useAuthStore } from "@/store/auth";

vi.mock("../../../features/auth/services/auth.service", () => ({
  authService: { refresh: vi.fn() },
}));

describe("bootstrapAuthSession", () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
    vi.mocked(authService.refresh).mockReset();
  });

  it("refreshes through the HttpOnly cookie and restores the session", async () => {
    vi.mocked(authService.refresh).mockResolvedValue({
      user: {
        id: "u1",
        email: "user@example.com",
        name: "User",
        tenantId: "fr-1",
        branchId: "br-1",
      } as any,
      accessToken: "access-1",
      expiresIn: 900,
    });
    await bootstrapAuthSession();
    expect(authService.refresh).toHaveBeenCalledOnce();
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().accessToken).toBe("access-1");
  });

  it("leaves the app logged out when no valid refresh cookie is present", async () => {
    useAuthStore.getState().setAccessToken("access-1");
    vi.mocked(authService.refresh).mockRejectedValue(new Error("expired"));
    await bootstrapAuthSession();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
