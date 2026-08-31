import { describe, expect, it } from "vitest";
import { resolveInventoryReversal, resolveStockBalance } from "../inventory-stock";
describe("inventory stock resolution", () => {
  it("adds IN stock", () =>
    expect(resolveStockBalance(10, 3, "IN")).toEqual({
      ok: true,
      balanceAfter: 13,
    }));
  it("subtracts OUT stock and rejects insufficient balance", () => {
    expect(resolveStockBalance(10, 3, "OUT")).toEqual({
      ok: true,
      balanceAfter: 7,
    });
    expect(resolveStockBalance(2, 3, "OUT")).toEqual({
      ok: false,
      reason: "INSUFFICIENT_STOCK",
    });
  });
  it("uses an absolute value for adjustment and subtracts waste", () => {
    expect(resolveStockBalance(10, 4, "ADJUSTMENT")).toEqual({
      ok: true,
      balanceAfter: 4,
    });
    expect(resolveStockBalance(10, 4, "WASTE")).toEqual({
      ok: true,
      balanceAfter: 6,
    });
    expect(resolveStockBalance(2, 4, "WASTE")).toEqual({
      ok: false,
      reason: "INSUFFICIENT_STOCK",
    });
  });
  it("reverses only the quantity actually deducted during a short deduction", () => {
    expect(resolveInventoryReversal(0, 2.25)).toEqual({ balanceAfter: 2.25 });
    expect(resolveInventoryReversal(7, 0)).toEqual({ balanceAfter: 7 });
  });
});
