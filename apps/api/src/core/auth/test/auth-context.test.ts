import { describe, expect, it } from "vitest";
import { ForbiddenError, MissingBranchError } from "@/core/errors";
import {
  requireBranch,
  requirePermission,
  requireRoles,
} from "@/core/auth/auth-context";

describe("auth context guards", () => {
  const base = {
    userId: "u",
    tenantId: "t",
    branchId: "b",
    email: "u@example.com",
    roles: ["MANAGER"] as any[],
    permissions: ["orders:read"],
  };
  it("accepts an allowed role and rejects missing roles", () => {
    expect(() => requireRoles(base as any, ["MANAGER"] as any)).not.toThrow();
    expect(() => requireRoles(base as any, ["OWNER"] as any)).toThrow(
      ForbiddenError,
    );
  });
  it("requires explicit permissions even when a global OWNER role is present", () => {
    expect(() =>
      requirePermission(
        { ...base, roles: ["OWNER"], permissions: [] } as any,
        "orders:write",
      ),
    ).toThrow(ForbiddenError);
    expect(() => requirePermission(base as any, "orders:write")).toThrow(
      ForbiddenError,
    );
  });
  it("requires tenant context for ordinary permissions", () => {
    expect(() =>
      requirePermission({ ...base, tenantId: "" } as any, "orders:read"),
    ).toThrow("Tenant context required");
    expect(() =>
      requirePermission({ ...base, tenantId: "" } as any, "tenant:read"),
    ).not.toThrow();
  });
  it("requires a specific branch", () => {
    expect(requireBranch(base as any)).toBe("b");
    expect(() => requireBranch({ ...base, branchId: null } as any)).toThrow(
      MissingBranchError,
    );
  });
});
