import { describe, expect, it } from "vitest";
import {
  assertBillingResourceAccess,
  requireBillingPermission,
} from "../billing-authorization";
import type { AuthContext } from "../../../core/auth";

const auth = (overrides: Partial<AuthContext> = {}): AuthContext => ({
  userId: "u1",
  tenantId: "t1",
  branchId: "b1",
  email: "u@example.com",
  roles: [],
  permissions: [],
  ...overrides,
});

describe("billing authorization", () => {
  it("requires the requested billing permission", () => {
    expect(() =>
      requireBillingPermission(
        auth({ permissions: ["billing:read"] }),
        "billing:read",
      ),
    ).not.toThrow();
    expect(() =>
      requireBillingPermission(auth({ permissions: [] }), "billing:read"),
    ).toThrow(/access denied|Insufficient permissions/);
  });
  it("allows tenant-wide access without a selected branch", () => {
    expect(() =>
      assertBillingResourceAccess(
        auth({ branchId: null, tenantWide: true }),
        "b1",
      ),
    ).not.toThrow();
  });
  it("allows tenant-wide access for the selected branch only", () => {
    expect(() =>
      assertBillingResourceAccess(auth({ tenantWide: true }), "b1"),
    ).not.toThrow();
    expect(() =>
      assertBillingResourceAccess(auth({ tenantWide: true }), "b2"),
    ).toThrow(/access denied|Insufficient permissions/);
  });
  it("requires an exact branch for branch-scoped access", () => {
    expect(() => assertBillingResourceAccess(auth(), "b1")).not.toThrow();
    expect(() => assertBillingResourceAccess(auth(), "b2")).toThrow(
      /access denied|Insufficient permissions/,
    );
    expect(() =>
      assertBillingResourceAccess(auth({ branchId: null }), "b1"),
    ).toThrow(/access denied|Insufficient permissions/);
  });
});
