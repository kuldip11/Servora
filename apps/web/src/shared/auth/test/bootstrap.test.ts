import { beforeEach, describe, expect, it, vi } from "vitest";
import { bootstrapAuthSession } from "../bootstrap";
import { authService } from "../../../features/auth/services/auth.service";
import { useAuthStore } from "../../../store/auth";

vi.mock("../../../features/auth/services/auth.service", () => ({
  authService: { refresh: vi.fn() },
}));

describe("bootstrapAuthSession", () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.getState().logout();
    vi.mocked(authService.refresh).mockReset();
  });

  it("cleans legacy auth state and returns when there is no refresh token", async () => {
    localStorage.setItem("pos-auth", "legacy");
    await bootstrapAuthSession();
    expect(localStorage.getItem("pos-auth")).toBeNull();
    expect(authService.refresh).not.toHaveBeenCalled();
  });

  it("refreshes and restores the authenticated session", async () => {
    localStorage.setItem("pos-refresh-token", "refresh-1");
    vi.mocked(authService.refresh).mockResolvedValue({
      user: {
        id: "u1",
        email: "user@example.com",
        name: "User",
        tenantId: "fr-1",
        branchId: "br-1",
      } as any,
      accessToken: "access-1",
      refreshToken: "refresh-2",
      expiresIn: 900,
    });
    await bootstrapAuthSession();
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().accessToken).toBe("access-1");
    expect(localStorage.getItem("pos-refresh-token")).toBe("refresh-2");
  });

  it("logs out when refresh fails", async () => {
    localStorage.setItem("pos-refresh-token", "refresh-1");
    useAuthStore.getState().setTokens("access-1", "refresh-1");
    vi.mocked(authService.refresh).mockRejectedValue(new Error("expired"));
    await bootstrapAuthSession();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(localStorage.getItem("pos-refresh-token")).toBeNull();
  });
});
