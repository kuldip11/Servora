import { describe, expect, it } from "vitest";
import { isBillableOrderItem } from "@/modules/orders/order-item-billing";

describe("refire billing semantics", () => {
  it("bills both the original and replacement for a legitimate reorder", () => {
    const lines = [
      { itemStatus: "REFIRED", compedAt: null, subtotal: 10 },
      { itemStatus: "ACTIVE", compedAt: null, subtotal: 10 },
    ];
    expect(
      lines
        .filter(isBillableOrderItem)
        .reduce((sum, line) => sum + line.subtotal, 0),
    ).toBe(20);
  });

  it("excludes only a refired original that was explicitly comped", () => {
    const lines = [
      { itemStatus: "REFIRED", compedAt: new Date(), subtotal: 10 },
      { itemStatus: "ACTIVE", compedAt: null, subtotal: 10 },
    ];
    expect(
      lines
        .filter(isBillableOrderItem)
        .reduce((sum, line) => sum + line.subtotal, 0),
    ).toBe(10);
  });
});
