import { beforeEach, describe, expect, it, vi } from "vitest";
const {
  findMany,
  findById,
  create,
  update,
  softDelete,
  hasOpenOrders,
  regenerateQrToken,
} = vi.hoisted(() => ({
  findMany: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  softDelete: vi.fn(),
  hasOpenOrders: vi.fn(),
  regenerateQrToken: vi.fn(),
}));
vi.mock("../table.repository", () => ({
  tableRepository: {
    findMany,
    findById,
    create,
    update,
    softDelete,
    hasOpenOrders,
    regenerateQrToken,
  },
}));
const { findBranch } = vi.hoisted(() => ({ findBranch: vi.fn() }));
vi.mock("../../branches/branch.repository", () => ({
  branchRepository: { findById: findBranch },
}));
vi.mock("../tables-authorization", () => ({
  requireTablesPermission: (a: any, p: string) => {
    if (!(a.permissions ?? []).includes(p))
      throw new Error(`Missing permission: ${p}`);
  },
  assertTableListScope: vi.fn(),
  assertTableResourceAccess: vi.fn(),
  resolveTableBranch: (a: any, b?: string) => b ?? a.branchId,
}));
import { tableService } from "@/modules/tables/table.service";
const auth: any = {
  userId: "u1",
  tenantId: "t1",
  branchId: "b1",
  tenantWide: true,
  authorizedBranchIds: ["b1"],
  permissions: [],
};
beforeEach(() => {
  vi.clearAllMocks();
  findBranch.mockResolvedValue({ id: "b1", tablesEnabled: true });
  findById.mockResolvedValue({ id: "t1", branchId: "b1" });
  hasOpenOrders.mockResolvedValue(false);
  update.mockResolvedValue({ id: "t1" });
  softDelete.mockResolvedValue({ id: "t1", isActive: false });
});
describe("table service", () => {
  it("lists with permission and creates only in an enabled branch", async () => {
    findMany.mockResolvedValue([{ id: "t1" }]);
    await expect(
      tableService.list({ ...auth, permissions: ["tables:read"] }),
    ).resolves.toEqual([{ id: "t1" }]);
    expect(findMany).toHaveBeenCalledWith("t1", "b1");
    create.mockResolvedValue({ id: "t1" });
    await expect(
      tableService.create(
        { ...auth, permissions: ["tables:create"] },
        { name: "A" },
      ),
    ).resolves.toEqual({ id: "t1" });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: "t1", branchId: "b1", name: "A" }),
    );
  });
  it("rejects missing/unknown/disabled branches", async () => {
    await expect(
      tableService.create(
        { ...auth, branchId: null, permissions: ["tables:create"] },
        { name: "A" },
      ),
    ).rejects.toThrow("specific branch");
    findBranch.mockResolvedValue(undefined);
    await expect(
      tableService.create(
        { ...auth, permissions: ["tables:create"] },
        { name: "A" },
      ),
    ).rejects.toThrow("Branch with id b1 not found");
    findBranch.mockResolvedValue({ id: "b1", tablesEnabled: false });
    await expect(
      tableService.create(
        { ...auth, permissions: ["tables:create"] },
        { name: "A" },
      ),
    ).rejects.toMatchObject({ details: { reason: "TABLES_DISABLED" } });
  });
  it("updates/statuses only when no open order exists", async () => {
    await expect(
      tableService.update({ ...auth, permissions: ["tables:update"] }, "t1", {
        name: "New",
      }),
    ).resolves.toEqual({ id: "t1" });
    hasOpenOrders.mockResolvedValue(true);
    await expect(
      tableService.update({ ...auth, permissions: ["tables:update"] }, "t1", {
        status: "OCCUPIED",
      }),
    ).rejects.toMatchObject({ details: { reason: "TABLE_HAS_ACTIVE_ORDER" } });
    await expect(
      tableService.updateStatus(
        { ...auth, permissions: ["tables:update"] },
        "t1",
        "AVAILABLE" as any,
      ),
    ).rejects.toMatchObject({ details: { reason: "TABLE_HAS_ACTIVE_ORDER" } });
  });
  it("blocks deletion with open orders and soft-deletes otherwise", async () => {
    hasOpenOrders.mockResolvedValue(true);
    await expect(
      tableService.remove({ ...auth, permissions: ["tables:delete"] }, "t1"),
    ).rejects.toMatchObject({ details: { reason: "TABLE_HAS_OPEN_ORDER" } });
    hasOpenOrders.mockResolvedValue(false);
    await expect(
      tableService.remove({ ...auth, permissions: ["tables:delete"] }, "t1"),
    ).resolves.toEqual({ id: "t1", isActive: false });
    expect(softDelete).toHaveBeenCalledWith("t1", "t1");
  });
  it("regenerates QR only for an authorized table", async () => {
    regenerateQrToken.mockResolvedValue({
      id: "t1",
      publicQrToken: "new-token",
    });
    await expect(
      tableService.regenerateQr(
        { ...auth, permissions: ["tables:update"] },
        "t1",
      ),
    ).resolves.toEqual({ id: "t1", publicQrToken: "new-token" });
    expect(regenerateQrToken).toHaveBeenCalledWith("t1", "t1");
  });
});
