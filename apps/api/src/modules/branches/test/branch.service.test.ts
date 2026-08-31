import { beforeEach, describe, expect, it, vi } from "vitest";
const {
  findMany,
  findById,
  findByCode,
  countActive,
  create,
  update,
  hasOpenOrders,
  hasOpenOrdersOfType,
} = vi.hoisted(() => ({
  findMany: vi.fn(),
  findById: vi.fn(),
  findByCode: vi.fn(),
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
    findByCode,
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
import { branchService } from "@/modules/branches/branch.service";
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
  findByCode.mockResolvedValue(undefined);
});
describe("branch service", () => {
  it("lists tenant-wide and branch-locked results with the correct repository scope", async () => {
    findMany.mockResolvedValue([{ id: "b1" }]);
    await expect(
      branchService.list({ ...baseAuth, permissions: ["branch:read"] }),
    ).resolves.toEqual([{ id: "b1" }]);
    expect(findMany).toHaveBeenCalledWith("t1", null, undefined);
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
        {
          name: "Main",
          code: " main-01 ",
          timezone: "Asia/Kolkata",
          currency: "inr",
        },
      ),
    ).resolves.toMatchObject({ id: "b1" });
    expect(create).toHaveBeenCalledWith({
      tenantId: "t1",
      name: "Main",
      code: "MAIN-01",
      timezone: "Asia/Kolkata",
      currency: "INR",
    });
    expect(writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "BRANCH_CREATED", entityId: "b1" }),
    );
  });
  it("validates branch timezone and capability invariants on create", async () => {
    await expect(
      branchService.create(
        { ...baseAuth, permissions: ["branch:create"] },
        {
          name: "Bad TZ",
          code: "BAD-TZ",
          timezone: "Mars/Olympus",
          currency: "INR",
        },
      ),
    ).rejects.toMatchObject({ code: "VALIDATION_FAILED" });

    await expect(
      branchService.create(
        { ...baseAuth, permissions: ["branch:create"] },
        {
          name: "No dine-in",
          code: "NO-DINE",
          timezone: "Asia/Kolkata",
          currency: "INR",
          dineInEnabled: false,
          tablesEnabled: true,
          takeawayEnabled: true,
        },
      ),
    ).rejects.toMatchObject({ details: { reason: "TABLES_REQUIRE_DINE_IN" } });
  });
  it("rejects duplicate branch codes within the franchise", async () => {
    findByCode.mockResolvedValue({ id: "existing" });
    await expect(
      branchService.create(
        { ...baseAuth, permissions: ["branch:create"] },
        {
          name: "Second",
          code: "MAIN-01",
          timezone: "Asia/Kolkata",
          currency: "INR",
        },
      ),
    ).rejects.toMatchObject({ details: { reason: "BRANCH_CODE_EXISTS" } });
    expect(create).not.toHaveBeenCalled();
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

it("lists every branch for tenant-wide users even when an active branch is selected", async () => {
  const { branchService } = await import("../branch.service");
  const auth = {
    tenantId: "t1",
    branchId: "b1",
    tenantWide: true,
    authorizedBranchIds: ["b1"],
    permissions: ["branch:read"],
    userId: "u1",
  } as any;
  await branchService.list(auth);
  expect(findMany).toHaveBeenCalledWith("t1", null, undefined);
});
