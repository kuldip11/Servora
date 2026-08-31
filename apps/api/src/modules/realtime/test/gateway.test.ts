import { beforeEach, describe, expect, it, vi } from "vitest";

const { resolveMembership } = vi.hoisted(() => ({
  resolveMembership: vi.fn(),
}));
const { resolveAuthorization } = vi.hoisted(() => ({
  resolveAuthorization: vi.fn(),
}));
const { subscribe } = vi.hoisted(() => ({ subscribe: vi.fn() }));
const { on } = vi.hoisted(() => ({ on: vi.fn() }));

vi.mock("../../../db", () => ({ db: {} }));
vi.mock("../../../lib/redis", () => ({
  subscriber: { subscribe, on },
  REDIS_CHANNELS: {
    ORDER_EVENTS: "orders",
    KITCHEN_EVENTS: "kitchen",
    INVENTORY_EVENTS: "inventory",
    TABLE_EVENTS: "tables",
  },
}));
vi.mock("../../../lib/authorization/authorization", () => ({
  resolveMembership,
  resolveAuthorization,
}));
vi.mock("../../../lib/jwt", () => ({ verifyAccessToken: vi.fn() }));

import { forwardTenantRealtimeMessage, resolveRealtimeContext } from "../gateway";

const payload = { sub: "u1" } as any;

beforeEach(() => {
  vi.clearAllMocks();
  subscribe.mockResolvedValue(undefined);
  resolveMembership.mockResolvedValue({ id: "m1", tenantId: "t1" });
  resolveAuthorization.mockResolvedValue({
    allowed: true,
    permissionKeys: ["orders:read"],
    branchIds: ["b1"],
    tenantWide: false,
  });
});

describe("realtime gateway context", () => {
  it("requires an explicit tenant and an active membership", async () => {
    await expect(resolveRealtimeContext(payload, "")).rejects.toThrow(
      "ACTIVE_FRANCHISE_REQUIRED",
    );

    resolveMembership.mockResolvedValue(undefined);
    await expect(resolveRealtimeContext(payload, "t1")).rejects.toThrow(
      "ACTIVE_FRANCHISE_REQUIRED",
    );
    expect(resolveMembership).toHaveBeenCalledWith({}, "u1", "t1");
  });

  it("requires one of the realtime read permissions and preserves the authorized branch scope", async () => {
    resolveAuthorization.mockResolvedValue({
      allowed: true,
      permissionKeys: ["menu:read"],
      branchIds: ["b1"],
      tenantWide: false,
    });
    await expect(resolveRealtimeContext(payload, "t1", "b1")).rejects.toThrow(
      "REALTIME_PERMISSION_REQUIRED",
    );

    resolveAuthorization.mockResolvedValue({
      allowed: true,
      permissionKeys: ["orders:read"],
      branchIds: ["b1"],
      tenantWide: false,
    });
    await expect(resolveRealtimeContext(payload, "t1", "b1")).resolves.toEqual({
      tenantId: "t1",
      membershipId: "m1",
      branchId: "b1",
    });
  });

  it("rejects unauthorized branches but permits tenant-wide or all-branch sessions", async () => {
    resolveAuthorization.mockResolvedValue({
      allowed: true,
      permissionKeys: ["tables:read"],
      branchIds: ["b1"],
      tenantWide: false,
    });
    await expect(resolveRealtimeContext(payload, "t1", "b2")).rejects.toThrow(
      "REALTIME_BRANCH_ACCESS_REQUIRED",
    );

    resolveAuthorization.mockResolvedValue({
      allowed: true,
      permissionKeys: ["tables:read"],
      branchIds: [],
      tenantWide: true,
    });
    await expect(resolveRealtimeContext(payload, "t1", "b2")).resolves.toEqual({
      tenantId: "t1",
      membershipId: "m1",
      branchId: "b2",
    });
    await expect(resolveRealtimeContext(payload, "t1", "all")).resolves.toEqual(
      { tenantId: "t1", membershipId: "m1", branchId: null },
    );
  });

  it("forwards a branch-scoped void event through the same tenant realtime transport as kitchen events", () => {
    const b1 = { __branchId: "b1", send: vi.fn() };
    const b2 = { __branchId: "b2", send: vi.fn() };
    const all = { __branchId: null, send: vi.fn() };
    const registry = new Map([["t1", new Set([b1, b2, all])]]);
    const message = JSON.stringify({ type: "order.item.voided", tenantId: "t1", branchId: "b1", payload: { id: "kt1" } });
    forwardTenantRealtimeMessage(message, registry);
    expect(b1.send).toHaveBeenCalledWith(message);
    expect(all.send).toHaveBeenCalledWith(message);
    expect(b2.send).not.toHaveBeenCalled();
  });

});
