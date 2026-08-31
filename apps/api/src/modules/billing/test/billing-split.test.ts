import { describe, expect, it } from "vitest";
import { allocateTotalsByWeight, areAllBillsPaid, buildSeatAllocationPlan, buildFractionalSeatAllocationPlan, combinedOrderAmounts, groupOrderItemsForEvenBills, splitMoneyEvenly, validateComboGroupAllocations, validateItemAllocations } from "../billing-split";

describe("multi-bill splitting", () => {
  it("distributes odd-cent totals exactly and evenly", () => {
    const shares = splitMoneyEvenly(10.01, 3);
    expect(shares).toEqual([3.34, 3.34, 3.33]);
    expect(Math.round(shares.reduce((sum, share) => sum + share, 0) * 100)).toBe(1001);
  });

  it("preserves a negative rounding adjustment exactly across an even split", () => {
    const shares = splitMoneyEvenly(-0.01, 2);
    expect(shares).toEqual([-0.01, 0]);
    expect(shares.reduce((sum, share) => sum + share, 0)).toBeCloseTo(-0.01, 8);
  });

  it("preserves signed weighted adjustments without negative zero", () => {
    expect(allocateTotalsByWeight(-0.01, [1, 1])).toEqual([-0.01, 0]);
    expect(allocateTotalsByWeight(-0.01, [0, 0])).toEqual([-0.01, 0]);
  });

  it("does not settle the order when only one split bill is paid", () => {
    const bills = [{ id: "one", totalAmount: "5.00" }, { id: "two", totalAmount: "5.00" }];
    expect(areAllBillsPaid(bills, new Map([["one", 5]]))).toBe(false);
    expect(areAllBillsPaid(bills, new Map([["one", 5], ["two", 5]]))).toBe(true);
  });

  it("builds one exact combined bill across merged orders", () => {
    expect(combinedOrderAmounts([
      { subtotal: "10.00", taxAmount: "1.00", discountAmount: "0.50", totalAmount: "10.50" },
      { subtotal: "20.00", taxAmount: "2.00", discountAmount: "0.00", totalAmount: "22.00" },
    ])).toEqual({ subtotal: "30.00", taxAmount: "3.00", discountAmount: "0.50", serviceChargeAmount: "0.00", roundingAdjustment: "0.00", totalAmount: "32.50" });
  });

  it("rejects partial and duplicate item allocations", () => {
    expect(validateItemAllocations(["a", "b", "c"], [
      { orderItemIds: ["a"] }, { orderItemIds: ["b"] },
    ])).toEqual({ ok: false, reason: "UNASSIGNED_ITEM" });
    expect(validateItemAllocations(["a", "b"], [
      { orderItemIds: ["a"] }, { orderItemIds: ["a", "b"] },
    ])).toEqual({ ok: false, reason: "DUPLICATE_ITEM" });
  });

  it("keeps combo groups atomic during an even bill split", () => {
    const grouped = groupOrderItemsForEvenBills([
      { id: "parent", comboGroupId: "combo-1" },
      { id: "child-a", comboGroupId: "combo-1" },
      { id: "child-b", comboGroupId: "combo-1" },
      { id: "regular-a", comboGroupId: null },
      { id: "regular-b", comboGroupId: null },
    ], 2);
    expect(grouped).not.toBeNull();
    const comboBills = grouped!.filter((ids) => ids.some((id) => id.startsWith("parent") || id.startsWith("child")));
    expect(comboBills).toHaveLength(1);
    expect(comboBills[0]).toEqual(expect.arrayContaining(["parent", "child-a", "child-b"]));
    expect(groupOrderItemsForEvenBills([
      { id: "parent", comboGroupId: "combo-1" },
      { id: "child", comboGroupId: "combo-1" },
    ], 2)).toBeNull();
  });

  it("keeps a combo parent and its component lines on the same item-split bill", () => {
    const items = [
      { id: "parent", comboGroupId: "combo-1" },
      { id: "child-a", comboGroupId: "combo-1" },
      { id: "child-b", comboGroupId: "combo-1" },
      { id: "regular", comboGroupId: null },
    ];
    expect(validateComboGroupAllocations(items, [
      { orderItemIds: ["parent", "child-a"] },
      { orderItemIds: ["child-b", "regular"] },
    ])).toEqual({ ok: false, reason: "SPLIT_COMBO_GROUP" });
    expect(validateComboGroupAllocations(items, [
      { orderItemIds: ["parent", "child-a", "child-b"] },
      { orderItemIds: ["regular"] },
    ])).toEqual({ ok: true });
  });

  it("accepts exact item coverage and preserves weighted total cents", () => {
    expect(validateItemAllocations(["a", "b", "c"], [
      { orderItemIds: ["a", "c"] }, { orderItemIds: ["b"] },
    ])).toEqual({ ok: true });
    const totals = allocateTotalsByWeight(10.01, [2, 1]);
    expect(totals.reduce((sum, value) => sum + value, 0)).toBeCloseTo(10.01);
  });

  it("does not add tax a second time when weighting inclusive-tax seat items", () => {
    const plan = buildSeatAllocationPlan([
      { id: "inclusive", seatLabel: "Seat 1", subtotal: "100", taxRate: "20", taxMode: "INCLUSIVE" },
      { id: "exclusive", seatLabel: "Seat 2", subtotal: "100", taxRate: "20", taxMode: "EXCLUSIVE" },
      { id: "shared", seatLabel: null, subtotal: "10", taxRate: "0", taxMode: "EXCLUSIVE" },
    ], "EVEN_SPLIT");
    expect(plan).toMatchObject({ status: "complete" });
    if (plan.status === "complete") {
      expect(plan.allocations.find((entry) => entry.label === "Seat 1")?.orderItemIds).toContain("shared");
    }
  });

  it("keeps shared combo rows together during automatic seat splitting", () => {
    const items = [
      { id: "seat-1", seatLabel: "Seat 1", subtotal: "10", taxRate: "0" },
      { id: "seat-2", seatLabel: "Seat 2", subtotal: "20", taxRate: "0" },
      { id: "combo-parent", comboGroupId: "combo-1", seatLabel: null, subtotal: "0", taxRate: "0" },
      { id: "combo-child", comboGroupId: "combo-1", seatLabel: null, subtotal: "9", taxRate: "0" },
    ];
    const plan = buildSeatAllocationPlan(items, "EVEN_SPLIT");
    expect(plan.status).toBe("complete");
    if (plan.status === "complete") {
      const comboBills = plan.allocations.filter((allocation) =>
        allocation.orderItemIds.includes("combo-parent") || allocation.orderItemIds.includes("combo-child"),
      );
      expect(comboBills).toHaveLength(1);
      expect(comboBills[0]!.orderItemIds).toEqual(expect.arrayContaining(["combo-parent", "combo-child"]));
    }
  });

  it("groups seat-labelled items and handles shared items by the chosen strategy", () => {
    const items = [
      { id: "a", seatLabel: "Seat 1", subtotal: "10", taxRate: "0" },
      { id: "b", seatLabel: "Seat 2", subtotal: "20", taxRate: "0" },
      { id: "shared", seatLabel: null, subtotal: "5", taxRate: "0" },
    ];
    expect(buildSeatAllocationPlan(items, "MANUAL")).toMatchObject({ status: "manual_required", sharedItemIds: ["shared"] });
    const automatic = buildSeatAllocationPlan(items, "EVEN_SPLIT");
    expect(automatic).toMatchObject({ status: "complete" });
    if (automatic.status === "complete") {
      expect(validateItemAllocations(items.map((item) => item.id), automatic.allocations)).toEqual({ ok: true });
      expect(automatic.allocations.find((allocation) => allocation.label === "Seat 1")?.orderItemIds).toContain("shared");
    }
  });
});

describe("G5 fractional shared-dish splitting", () => {
  const shared = {
    id: "platter", seatLabel: null, subtotal: "30.00", taxRate: "0", taxMode: "EXCLUSIVE" as const,
    seatShares: [
      { seatLabel: "Seat 1", shareRatio: "0.333333" },
      { seatLabel: "Seat 2", shareRatio: "0.333333" },
      { seatLabel: "Seat 3", shareRatio: "0.333334" },
    ],
  };

  it("rejects ratios that do not cover exactly one whole item", () => {
    expect(() => buildFractionalSeatAllocationPlan([
      { ...shared, seatShares: [{ seatLabel: "Seat 1", shareRatio: 0.4 }, { seatLabel: "Seat 2", shareRatio: 0.4 }] },
    ], "EVEN_SPLIT")).toThrow("INVALID_SEAT_SHARE_TOTAL");
  });

  it("allocates one shared line fractionally without gaps or double counting", () => {
    const plan = buildFractionalSeatAllocationPlan([shared], "EVEN_SPLIT");
    expect(plan).toMatchObject({ status: "complete" });
    if (!plan || plan.status !== "complete") throw new Error("expected complete plan");
    const shares = plan.allocations.flatMap((allocation) => allocation.itemShares);
    expect(shares).toHaveLength(3);
    expect(shares.reduce((sum, entry) => sum + entry.shareRatio, 0)).toBeCloseTo(1, 6);
    expect(shares.reduce((sum, entry) => sum + 30 * entry.shareRatio, 0)).toBeCloseTo(30, 6);
  });

  it("preserves whole-line B9 allocation when mixed with fractional lines", () => {
    const plan = buildFractionalSeatAllocationPlan([
      shared,
      { id: "drink-1", seatLabel: "Seat 1", subtotal: "5", taxRate: "0", taxMode: "EXCLUSIVE" },
      { id: "shared-bread", seatLabel: null, subtotal: "6", taxRate: "0", taxMode: "EXCLUSIVE" },
    ], "EVEN_SPLIT");
    expect(plan?.status).toBe("complete");
    if (!plan || plan.status !== "complete") throw new Error("expected complete plan");
    expect(plan.allocations.flatMap((allocation) => allocation.itemShares).filter((share) => share.orderItemId === "shared-bread")).toHaveLength(1);
    expect(plan.allocations.flatMap((allocation) => allocation.itemShares).reduce((sum, share) => sum + (share.orderItemId === "platter" ? 30 : share.orderItemId === "drink-1" ? 5 : 6) * share.shareRatio, 0)).toBeCloseTo(41, 6);
  });
});
