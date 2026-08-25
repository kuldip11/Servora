import { describe, expect, it } from "vitest";
import { resolveStockBalance } from "../inventory-stock";
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
  it("uses absolute values for adjustment and waste", () => {
    expect(resolveStockBalance(10, 4, "ADJUSTMENT")).toEqual({
      ok: true,
      balanceAfter: 4,
    });
    expect(resolveStockBalance(10, 4, "WASTE")).toEqual({
      ok: true,
      balanceAfter: 4,
    });
  });
});
