import { describe, expect, it } from "vitest";
import {
  assertInventoryResourceBranch,
  requireInventoryPermission,
  requireInventoryTransactionPermission,
  resolveInventoryBranch,
} from "@/modules/inventory/inventory-authorization";
import type { AuthContext } from "@/core/auth";
const auth = (o: Partial<AuthContext> = {}): AuthContext => ({
  userId: "u1",
  tenantId: "t1",
  branchId: "b1",
  email: "u@example.com",
  roles: [],
  permissions: [],
  authorizedBranchIds: ["b1"],
  ...o,
});
describe("inventory authorization", () => {
  it("requires inventory permissions", () => {
    expect(() =>
      requireInventoryPermission(
        auth({ permissions: ["inventory:read"] }),
        "inventory:read",
      ),
    ).not.toThrow();
    expect(() => requireInventoryPermission(auth(), "inventory:read")).toThrow(
      "Insufficient permissions",
    );
  });
  it("resolves selected/requested branch and allows tenant-wide access", () => {
    expect(resolveInventoryBranch(auth(), "b1")).toBe("b1");
    expect(
      resolveInventoryBranch(auth({ tenantWide: true, branchId: null }), "b2"),
    ).toBe("b2");
  });
  it("rejects missing or unauthorized branches", () => {
    expect(() =>
      resolveInventoryBranch(auth({ branchId: null }), undefined),
    ).toThrow();
    expect(() =>
      resolveInventoryBranch(auth({ authorizedBranchIds: ["b1"] }), "b2"),
    ).toThrow("Branch access denied");
    expect(() =>
      assertInventoryResourceBranch(
        auth({ authorizedBranchIds: ["b1"] }),
        "b2",
      ),
    ).toThrow("Branch access denied");
    expect(() =>
      assertInventoryResourceBranch(
        auth({ tenantWide: true, branchId: null }),
        "b2",
      ),
    ).not.toThrow();
  });
  it("maps transaction types to the required permissions", () => {
    for (const type of ["IN", "OUT"] as const)
      expect(() =>
        requireInventoryTransactionPermission(
          auth({ permissions: ["inventory:update"] }),
          type,
        ),
      ).not.toThrow();
    expect(() =>
      requireInventoryTransactionPermission(
        auth({ permissions: ["inventory:adjust"] }),
        "ADJUSTMENT",
      ),
    ).not.toThrow();
    expect(() =>
      requireInventoryTransactionPermission(
        auth({ permissions: ["inventory:waste"] }),
        "WASTE",
      ),
    ).not.toThrow();
  });
});
