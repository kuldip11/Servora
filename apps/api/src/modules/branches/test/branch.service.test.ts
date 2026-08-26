import { beforeEach, describe, expect, it, vi } from "vitest";
const {
  findMany,
  findById,
  countActive,
  create,
  update,
  hasOpenOrders,
  hasOpenOrdersOfType,
} = vi.hoisted(() => ({
  findMany: vi.fn(),
  findById: vi.fn(),
  countActive: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  hasOpenOrders: vi.fn(),
  hasOpenOrdersOfType: vi.fn(),
}));
vi.mock("../branch.repository", () => ({
  branchRepository: {
    findMany,
    findById,
    countActive,
    create,
    update,
    hasOpenOrders,
    hasOpenOrdersOfType,
  },
}));
const { writeAudit } = vi.hoisted(() => ({ writeAudit: vi.fn() }));
vi.mock("../../../core/audit", () => ({ writeAudit }));
vi.mock("../../../core/auth", () => ({
  requirePermission: (auth: any, p: string) => {
    if (!(auth.permissions ?? []).includes(p))
      throw new Error(`Missing permission: ${p}`);
  },
}));
import { branchService } from "../branch.service";
const baseAuth: any = {
  userId: "u1",
  tenantId: "t1",
  branchId: "b1",
  email: "u@example.com",
  roles: [],
  permissions: [],
  tenantWide: true,
  authorizedBranchIds: [],
};
beforeEach(() => {
  vi.clearAllMocks();
});
describe("branch service", () => {
  it("lists tenant-wide and branch-locked results with the correct repository scope", async () => {
    findMany.mockResolvedValue([{ id: "b1" }]);
    await expect(
      branchService.list({ ...baseAuth, permissions: ["branch:read"] }),
    ).resolves.toEqual([{ id: "b1" }]);
    expect(findMany).toHaveBeenCalledWith("t1", "b1", undefined);
    findMany.mockResolvedValue([{ id: "b2" }]);
    await branchService.list({
      ...baseAuth,
      permissions: ["branch:read"],
      tenantWide: false,
      authorizedBranchIds: ["b2"],
    });
    expect(findMany).toHaveBeenLastCalledWith("t1", "b1", ["b2"]);
  });
  it("creates branches and audits the creation", async () => {
    create.mockResolvedValue({ id: "b1", name: "Main" });
    await expect(
      branchService.create(
        { ...baseAuth, permissions: ["branch:create"] },
        { name: "Main" },
      ),
    ).resolves.toMatchObject({ id: "b1" });
    expect(create).toHaveBeenCalledWith({ tenantId: "t1", name: "Main" });
    expect(writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "BRANCH_CREATED", entityId: "b1" }),
    );
  });
  it("rejects capability updates that disable every order type", async () => {
    findById.mockResolvedValue({
      id: "b1",
      dineInEnabled: true,
      takeawayEnabled: false,
      deliveryEnabled: false,
      onlineEnabled: false,
    });
    await expect(
      branchService.update(
        { ...baseAuth, permissions: ["branch:update"] },
        "b1",
        { dineInEnabled: false },
      ),
    ).rejects.toMatchObject({
      details: { reason: "ALL_ORDER_TYPES_DISABLED" },
    });
  });
  it("blocks dine-in shutdown while dine-in orders remain open", async () => {
    findById.mockResolvedValue({
      id: "b1",
      dineInEnabled: true,
      takeawayEnabled: true,
      deliveryEnabled: false,
      onlineEnabled: false,
    });
    hasOpenOrdersOfType.mockResolvedValue(true);
    await expect(
      branchService.update(
        { ...baseAuth, permissions: ["branch:update"] },
        "b1",
        { dineInEnabled: false },
      ),
    ).rejects.toMatchObject({
      details: { reason: "BRANCH_HAS_OPEN_DINE_IN_ORDERS" },
    });
  });
  it("prevents unauthorized branch updates and protects the last active branch", async () => {
    const locked = {
      ...baseAuth,
      tenantWide: false,
      authorizedBranchIds: ["other"],
      permissions: ["branch:update"],
    };
    await expect(
      branchService.update(locked, "b1", { name: "Nope" }),
    ).rejects.toMatchObject({ details: { id: "b1" } });
    countActive.mockResolvedValue(1);
    await expect(
      branchService.deactivate(
        { ...baseAuth, permissions: ["branch:archive"] },
        "b1",
      ),
    ).rejects.toMatchObject({ details: { reason: "LAST_BRANCH" } });
  });
  it("blocks open-order deactivation and audits successful deactivation", async () => {
    countActive.mockResolvedValue(2);
    hasOpenOrders.mockResolvedValue(true);
    await expect(
      branchService.deactivate(
        { ...baseAuth, permissions: ["branch:archive"] },
        "b1",
      ),
    ).rejects.toMatchObject({ details: { reason: "BRANCH_HAS_OPEN_ORDERS" } });
    hasOpenOrders.mockResolvedValue(false);
    update.mockResolvedValue({ id: "b1", isActive: false });
    await expect(
      branchService.deactivate(
        { ...baseAuth, permissions: ["branch:archive"] },
        "b1",
      ),
    ).resolves.toMatchObject({ isActive: false });
    expect(update).toHaveBeenCalledWith("t1", "b1", { isActive: false });
    expect(writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "BRANCH_ARCHIVED", entityId: "b1" }),
    );
  });
});
