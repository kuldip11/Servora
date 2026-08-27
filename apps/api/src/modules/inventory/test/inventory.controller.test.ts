import { describe, expect, it, vi } from "vitest";
const { list, create, updateStock, lowStockAlerts, recentTransactions } = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  updateStock: vi.fn(),
  lowStockAlerts: vi.fn(),
  recentTransactions: vi.fn(),
}));
vi.mock("../inventory.service", () => ({
  inventoryService: { list, create, updateStock, lowStockAlerts, recentTransactions },
}));
import { inventoryController } from "../inventory.controller";
const auth = {
  userId: "u1",
  tenantId: "t1",
  branchId: "b1",
  email: "u@example.com",
  roles: [],
  permissions: [],
} as any;
describe("inventory controller", () => {
  it("delegates list and wraps a success response", async () => {
    list.mockResolvedValue([{ id: "i1" }]);
    await expect(inventoryController.list(auth)).resolves.toEqual({
      success: true,
      data: [{ id: "i1" }],
    });
    expect(list).toHaveBeenCalledWith(auth);
  });
  it("delegates create with a created response", async () => {
    const input = {
      name: "Flour",
      unit: "KG",
      currentStock: 1,
      minimumStock: 2,
      reorderPoint: 3,
      costPerUnit: 4,
    };
    create.mockResolvedValue({ id: "i1" });
    await expect(
      inventoryController.create(auth, input as any),
    ).resolves.toEqual({ success: true, data: { id: "i1" } });
    expect(create).toHaveBeenCalledWith(auth, input);
  });
  it("delegates stock updates and low-stock alerts", async () => {
    updateStock.mockResolvedValue({
      item: { id: "i1" },
      transaction: { id: "tx1" },
    });
    lowStockAlerts.mockResolvedValue([{ id: "i1" }]);
    await expect(
      inventoryController.updateStock(auth, "i1", {
        quantity: 2,
        transactionType: "IN",
      } as any),
    ).resolves.toEqual({
      success: true,
      data: { item: { id: "i1" }, transaction: { id: "tx1" } },
    });
    await expect(inventoryController.lowStockAlerts(auth)).resolves.toEqual({
      success: true,
      data: [{ id: "i1" }],
    });
  });
});
