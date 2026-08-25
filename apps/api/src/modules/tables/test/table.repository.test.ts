import { beforeEach, describe, expect, it, vi } from "vitest";
const { restaurantTables, orders } = vi.hoisted(() => ({
  restaurantTables: {
    tenantId: "tenantId",
    id: "id",
    isActive: "isActive",
    branchId: "branchId",
    createdAt: "createdAt",
  },
  orders: {
    tenantId: "tenantId",
    tableId: "tableId",
    status: "status",
    id: "id",
  },
}));
vi.mock("../../../db/schema", () => ({ restaurantTables, orders }));
const { findMany, findFirst, returning, db } = vi.hoisted(() => {
  const findMany = vi.fn(),
    findFirst = vi.fn(),
    returning = vi.fn();
  const query = {
    restaurantTables: { findMany, findFirst },
    orders: { findFirst },
  };
  const db: any = {
    query,
    insert: vi.fn(() => ({ values: vi.fn(() => ({ returning })) })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({ where: vi.fn(() => ({ returning })) })),
    })),
  };
  return { findMany, findFirst, returning, db };
});
vi.mock("../../../db", () => ({ db }));
vi.mock("../../../lib/object-utils", () => ({
  compact: (v: any) =>
    Object.fromEntries(Object.entries(v).filter(([, x]) => x !== undefined)),
}));
import { tableRepository } from "../table.repository";
beforeEach(() => {
  vi.clearAllMocks();
});
describe("table repository", () => {
  it("maps tenant and optional branch filters for listing and lookup", async () => {
    findMany.mockResolvedValue([{ id: "t1" }]);
    findFirst.mockResolvedValue({ id: "t1" });
    await expect(tableRepository.findMany("t1", "b1")).resolves.toEqual([
      { id: "t1" },
    ]);
    await expect(tableRepository.findMany("t1", null)).resolves.toEqual([
      { id: "t1" },
    ]);
    await expect(tableRepository.findById("t1", "t1")).resolves.toEqual({
      id: "t1",
    });
    expect(findMany).toHaveBeenCalledTimes(2);
  });
  it("maps create/update/delete and open-order checks", async () => {
    returning.mockResolvedValue([{ id: "t1" }]);
    await expect(
      tableRepository.create({ tenantId: "t1", branchId: "b1", name: "A" }),
    ).resolves.toEqual({ id: "t1" });
    await expect(
      tableRepository.update("t1", "t1", { name: "B" }),
    ).resolves.toEqual({ id: "t1" });
    await expect(tableRepository.softDelete("t1", "t1")).resolves.toEqual({
      id: "t1",
    });
    findFirst
      .mockResolvedValueOnce({ id: "o1" })
      .mockResolvedValueOnce(undefined);
    await expect(tableRepository.hasOpenOrders("t1", "t1")).resolves.toBe(true);
    await expect(tableRepository.hasOpenOrders("t1", "t1")).resolves.toBe(
      false,
    );
  });
});
