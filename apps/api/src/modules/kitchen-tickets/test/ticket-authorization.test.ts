import { describe, expect, it } from "vitest";
import {
  assertKitchenTicketAccess,
  requireKitchenPermission,
  requireKitchenStatusPermission,
} from "@/modules/kitchen-tickets/ticket-authorization";
const auth = (overrides: any = {}) => ({
  userId: "u1",
  tenantId: "t1",
  branchId: "b1",
  email: "u@example.com",
  roles: [],
  permissions: [],
  ...overrides,
});

describe("kitchen ticket authorization", () => {
  it("requires kitchen permissions", () => {
    expect(() =>
      requireKitchenPermission(
        auth({ permissions: ["kitchen:read"] }),
        "kitchen:read",
      ),
    ).not.toThrow();
    expect(() => requireKitchenPermission(auth(), "kitchen:update")).toThrow(
      /access denied|Insufficient permissions/,
    );
  });

  it("allows waiters to serve ready tickets without granting kitchen workflow access", () => {
    const waiter = auth({ permissions: ["orders:update_status"] });
    expect(() => requireKitchenStatusPermission(waiter, "SERVED")).not.toThrow();
    expect(() => requireKitchenStatusPermission(waiter, "PREPARING")).toThrow(
      /access denied|Insufficient permissions/,
    );
    const chef = auth({ permissions: ["kitchen:update"] });
    expect(() => requireKitchenStatusPermission(chef, "PREPARING")).not.toThrow();
    expect(() => requireKitchenStatusPermission(chef, "SERVED")).not.toThrow();
  });
  it("allows tenant-wide access unless a selected branch narrows it", () => {
    expect(() =>
      assertKitchenTicketAccess(
        auth({ tenantWide: true, branchId: null }),
        "b9",
      ),
    ).not.toThrow();
    expect(() =>
      assertKitchenTicketAccess(auth({ tenantWide: true }), "b1"),
    ).not.toThrow();
    expect(() =>
      assertKitchenTicketAccess(auth({ tenantWide: true }), "b2"),
    ).toThrow(/access denied|Insufficient permissions/);
  });
  it("requires exact branch access for branch-scoped users", () => {
    expect(() => assertKitchenTicketAccess(auth(), "b1")).not.toThrow();
    expect(() => assertKitchenTicketAccess(auth(), "b2")).toThrow(
      /access denied|Insufficient permissions/,
    );
    expect(() =>
      assertKitchenTicketAccess(auth({ branchId: null }), "b1"),
    ).toThrow(/access denied|Insufficient permissions/);
  });
});
