import { beforeEach, describe, expect, it, vi } from "vitest";
import { restoreActiveContext } from "@/shared/auth/active-context";
import { useAuthStore } from "@/store/auth";

vi.mock("@/features/auth/services/auth.service", () => ({
  authService: {
    me: vi.fn(async () => ({ id: "u1", email: "owner@example.com", roles: [] })),
  },
}));

const membership = (membershipId: string, franchiseId: string, branchIds: string[], tenantWide = true) => ({
  membershipId,
  tenant: { id: franchiseId, name: franchiseId },
  roles: [{ id: "r1", name: "OWNER" as const, scope: tenantWide ? "TENANT" as const : "BRANCH" as const }],
  branches: branchIds.map((id) => ({ id, name: id, address: "", isActive: true, tablesEnabled: true })),
});

describe("persisted active context", () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.getState().logout();
    useAuthStore.getState().setAccessToken("token");
  });

  it("restores a still-authorized franchise and branch", async () => {
    localStorage.setItem("servora.active-context.v1", JSON.stringify({ membershipId: "m2", franchiseId: "f2", branchId: "b2" }));
    await restoreActiveContext([membership("m1", "f1", ["b1"]), membership("m2", "f2", ["b2"])] as any);
    expect(useAuthStore.getState()).toMatchObject({ membershipId: "m2", franchiseId: "f2", branchId: "b2" });
  });

  it("falls back safely when the saved franchise or branch is no longer authorized", async () => {
    localStorage.setItem("servora.active-context.v1", JSON.stringify({ membershipId: "removed", franchiseId: "removed", branchId: "removed" }));
    await restoreActiveContext([membership("m1", "f1", ["b1"], false)] as any);
    expect(useAuthStore.getState()).toMatchObject({ membershipId: "m1", franchiseId: "f1", branchId: "b1" });
  });

  it("restores All Branches only for tenant-wide memberships", async () => {
    localStorage.setItem("servora.active-context.v1", JSON.stringify({ membershipId: "m1", franchiseId: "f1", branchId: "all" }));
    await restoreActiveContext([membership("m1", "f1", ["b1"], true)] as any);
    expect(useAuthStore.getState().branchId).toBeNull();
  });
});
