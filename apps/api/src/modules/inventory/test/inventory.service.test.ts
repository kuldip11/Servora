import { beforeEach, describe, expect, it, vi } from "vitest";
const {
  findAllBranches,
  findMany,
  findBranch,
  create,
  findById,
  applyStockChange,
  findLowStock,
  findLowStockAllBranches,
  findRequiredRecipeLines,
  deductRecipeLines,
  findByIds,
  findAffectedMenuItemIds,
  findMenuItemsForAvailability,
  findNonOptionalIngredients,
  setMenuItemAvailabilityStatus,
  findOrderDeductions,
} = vi.hoisted(() => ({
  findAllBranches: vi.fn(),
  findMany: vi.fn(),
  findBranch: vi.fn(),
  create: vi.fn(),
  findById: vi.fn(),
  applyStockChange: vi.fn(),
  findLowStock: vi.fn(),
  findLowStockAllBranches: vi.fn(),
  findRequiredRecipeLines: vi.fn(),
  deductRecipeLines: vi.fn(),
  findByIds: vi.fn(),
  findAffectedMenuItemIds: vi.fn(),
  findMenuItemsForAvailability: vi.fn(),
  findNonOptionalIngredients: vi.fn(),
  setMenuItemAvailabilityStatus: vi.fn(),
  findOrderDeductions: vi.fn(),
}));
vi.mock("../inventory.repository", () => ({
  inventoryRepository: {
    findAllBranches,
    findMany,
    findBranch,
    create,
    findById,
    applyStockChange,
    findLowStock,
    findLowStockAllBranches,
    findRequiredRecipeLines,
    deductRecipeLines,
    findByIds,
    findAffectedMenuItemIds,
    findMenuItemsForAvailability,
    findNonOptionalIngredients,
    setMenuItemAvailabilityStatus,
    findOrderDeductions,
  },
}));
const { publish } = vi.hoisted(() => ({ publish: vi.fn() }));
vi.mock("../../../lib/event-bus", () => ({ eventBus: { publish } }));
import { inventoryService } from "../inventory.service";
const baseAuth: any = {
  userId: "u1",
  tenantId: "t1",
  branchId: "b1",
  email: "u@example.com",
  roles: [],
  permissions: [],
  authorizedBranchIds: ["b1"],
};
beforeEach(() => {
  vi.clearAllMocks();
});
describe("inventory service", () => {
  it("lists all branches for tenant-wide context and branch items otherwise", async () => {
    findAllBranches.mockResolvedValue([{ id: "a" }]);
    findMany.mockResolvedValue([{ id: "b" }]);
    await expect(
      inventoryService.list({
        ...baseAuth,
        permissions: ["inventory:read"],
        tenantWide: true,
        branchId: null,
      }),
    ).resolves.toEqual([{ id: "a" }]);
    await expect(
      inventoryService.list({ ...baseAuth, permissions: ["inventory:read"] }),
    ).resolves.toEqual([{ id: "b" }]);
    expect(findMany).toHaveBeenCalledWith("t1", "b1");
  });
  it("creates inventory and publishes low-stock events", async () => {
    findBranch.mockResolvedValue({ id: "b1" });
    create.mockResolvedValue({
      id: "i1",
      branchId: "b1",
      currentStock: "2",
      minimumStock: "3",
    });
    const input: any = {
      name: "Flour",
      unit: "KG",
      currentStock: 2,
      minimumStock: 3,
      reorderPoint: 4,
      costPerUnit: 2,
    };
    await expect(
      inventoryService.create(
        { ...baseAuth, permissions: ["inventory:create"] },
        input,
      ),
    ).resolves.toMatchObject({ id: "i1" });
    expect(publish).toHaveBeenCalledWith(
      expect.objectContaining({ type: "inventory.low_stock" }),
      "t1",
      "b1",
    );
  });
  it("maps stock update outcomes and syncs availability on success", async () => {
    findById.mockResolvedValue({ id: "i1", branchId: "b1" });
    applyStockChange.mockResolvedValue({ status: "insufficient_stock" });
    await expect(
      inventoryService.updateStock(
        { ...baseAuth, permissions: ["inventory:update"] },
        "i1",
        { quantity: 5, transactionType: "OUT" } as any,
      ),
    ).rejects.toThrow("Insufficient stock");
    applyStockChange.mockResolvedValue({
      status: "ok",
      item: { id: "i1", branchId: "b1", currentStock: "2", minimumStock: "3" },
      transaction: { id: "tx1" },
    });
    findAffectedMenuItemIds.mockResolvedValue([]);
    await expect(
      inventoryService.updateStock(
        { ...baseAuth, permissions: ["inventory:update"] },
        "i1",
        { quantity: 1, transactionType: "IN" } as any,
      ),
    ).resolves.toEqual({
      item: expect.any(Object),
      transaction: { id: "tx1" },
    });
    expect(publish).toHaveBeenCalled();
  });
  it("validates recipe stock and ignores deduction-disabled recipes", async () => {
    findRequiredRecipeLines.mockResolvedValue([
      {
        menuItemId: "m1",
        inventoryItemId: "i1",
        quantityRequired: "2",
        menuItem: { enableRecipeDeduction: true },
        inventoryItem: { currentStock: "3", name: "Flour" },
      },
      {
        menuItemId: "m2",
        inventoryItemId: "i2",
        quantityRequired: "9",
        menuItem: { enableRecipeDeduction: false },
        inventoryItem: { currentStock: "0", name: "Salt" },
      },
    ]);
    await expect(
      inventoryService.validateStock("t1", "b1", [
        { menuItemId: "m1", quantity: 2 },
        { menuItemId: "m2", quantity: 1 },
      ]),
    ).resolves.toEqual({
      valid: false,
      insufficient: [
        { menuItemId: "m1", inventoryItemId: "i1", name: "Flour" },
      ],
    });
  });
  it("deducts recipe lines only when recipe deduction is enabled", async () => {
    findRequiredRecipeLines.mockResolvedValue([
      {
        menuItemId: "m1",
        inventoryItemId: "i1",
        unit: "KG",
        quantityRequired: "2",
        menuItem: { enableRecipeDeduction: true },
      },
    ]);
    deductRecipeLines.mockResolvedValue({
      deducted: 1,
      touchedInventoryItemIds: [],
      short: [],
    });
    await expect(
      inventoryService.deductForOrderItems(
        "t1",
        "b1",
        "o1",
        "kt1",
        [{ menuItemId: "m1", quantity: 3 }],
        "u1",
      ),
    ).resolves.toEqual({ deducted: 1, short: [] });
    expect(deductRecipeLines).toHaveBeenCalledWith(
      "t1",
      "b1",
      "o1",
      "kt1",
      [expect.objectContaining({ neededQuantity: 6 })],
      "u1",
    );
  });
  it("re-syncs active menu items to OUT_OF_STOCK and back when ingredients change", async () => {
    findAffectedMenuItemIds.mockResolvedValue(["m1"]);
    findMenuItemsForAvailability.mockResolvedValue([
      { id: "m1", enableRecipeDeduction: true, status: "ACTIVE" },
    ]);
    findNonOptionalIngredients.mockResolvedValue([
      { quantityRequired: "2", inventoryItem: { currentStock: "1" } },
    ]);
    await inventoryService.syncMenuItemAvailability("t1", "b1", ["i1"]);
    expect(setMenuItemAvailabilityStatus).toHaveBeenCalledWith(
      "m1",
      "OUT_OF_STOCK",
      "Insufficient inventory",
    );
    findMenuItemsForAvailability.mockResolvedValue([
      { id: "m1", enableRecipeDeduction: true, status: "OUT_OF_STOCK" },
    ]);
    findNonOptionalIngredients.mockResolvedValue([
      { quantityRequired: "2", inventoryItem: { currentStock: "3" } },
    ]);
    await inventoryService.syncMenuItemAvailability("t1", "b1", ["i1"]);
    expect(setMenuItemAvailabilityStatus).toHaveBeenCalledWith(
      "m1",
      "ACTIVE",
      null,
    );
  });
});
