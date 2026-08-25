import { describe, expect, it } from "vitest";
import {
  assertAnalyticsScope,
  requireAnalyticsPermission,
} from "../analytics-authorization";
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

describe("analytics authorization", () => {
  it("requires analytics:read", () => {
    expect(() =>
      requireAnalyticsPermission(
        auth({ permissions: ["analytics:read"] }),
        "analytics:read",
      ),
    ).not.toThrow();
    expect(() => requireAnalyticsPermission(auth(), "analytics:read")).toThrow(
      "Insufficient permissions",
    );
  });
  it("allows a selected branch or tenant-wide all-branches access", () => {
    expect(() =>
      assertAnalyticsScope(auth({ branchId: "b1", tenantWide: false })),
    ).not.toThrow();
    expect(() =>
      assertAnalyticsScope(auth({ branchId: null, tenantWide: true })),
    ).not.toThrow();
  });
  it("rejects branchless non-tenant-wide access", () => {
    expect(() =>
      assertAnalyticsScope(auth({ branchId: null, tenantWide: false })),
    ).toThrow("Insufficient permissions");
  });
});
