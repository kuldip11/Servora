import { describe, expect, it } from "vitest";
import { calculateTaxServiceAndRounding } from "../pricing/final-totals-stage";
import type { PricedLine } from "../pricing/pricing-pipeline";

const line = (subtotal: number, taxRate: number, taxMode: "INCLUSIVE" | "EXCLUSIVE" = "EXCLUSIVE"): PricedLine => ({
  menuItemId: "item", menuItemName: "Item", quantity: 1, unitPrice: subtotal, subtotal, taxRate, taxMode,
  fulfillmentType: "DINE_IN", modifiers: [], pricingAttribution: { BASE_PRICE: subtotal, VARIANT: 0, MODIFIER: 0 },
});
const settings = (overrides: Partial<Parameters<typeof calculateTaxServiceAndRounding>[1]> = {}) => ({
  serviceChargePercent: null,
  serviceChargeTaxable: false,
  roundingPolicy: "NONE" as const,
  defaultTaxMode: "EXCLUSIVE" as const,
  ...overrides,
});

describe("pricing pipeline stage 8 service charge", () => {
  it("adds a non-taxable service charge after discounts without changing tax base", () => {
    const item = line(100, 10); item.pricingAttribution.PROMOTION = -20;
    const result = calculateTaxServiceAndRounding([item], settings({ serviceChargePercent: "5" }));
    expect(result.serviceChargeAmount).toBe(4);
    expect(result.taxAmount).toBe(8);
    expect(result.totalAmount).toBe(92);
  });
  it("folds a taxable service charge into the applicable line tax base", () => {
    const result = calculateTaxServiceAndRounding([line(100, 10)], settings({ serviceChargePercent: "5", serviceChargeTaxable: true }));
    expect(result.serviceChargeAmount).toBe(5);
    expect(result.taxAmount).toBe(10.5);
    expect(result.totalAmount).toBe(115.5);
  });
  it("computes the service charge once across the complete post-discount order", () => {
    const result = calculateTaxServiceAndRounding([line(0.10, 0), line(0.10, 0)], settings({ serviceChargePercent: "5" }));
    expect(result.serviceChargeAmount).toBe(0.01);
    expect(result.totalAmount).toBe(0.21);
  });
  it("taxes a service charge correctly when the merchandise price is tax-inclusive", () => {
    const result = calculateTaxServiceAndRounding([line(110, 10, "INCLUSIVE")], settings({ serviceChargePercent: "10", serviceChargeTaxable: true }));
    expect(result.serviceChargeAmount).toBe(11);
    expect(result.taxAmount).toBe(11.1);
    expect(result.totalAmount).toBe(122.1);
  });
});

describe("pricing pipeline stage 9 rounding", () => {
  it.each([
    ["NONE", 112.4, 112.4, 0],
    ["NEAREST_1", 112.4, 112, -0.4],
    ["NEAREST_5", 112.4, 110, -2.4],
    ["NEAREST_10", 116, 120, 4],
    ["NEAREST_5", 115, 115, 0],
  ] as const)("applies %s explicitly", (roundingPolicy, subtotal, total, adjustment) => {
    const result = calculateTaxServiceAndRounding([line(subtotal, 0)], settings({ roundingPolicy }));
    expect(result.totalAmount).toBe(total);
    expect(result.roundingAdjustment).toBe(adjustment);
  });
});

describe("pricing pipeline stage 7 tax mode", () => {
  it("backs tax out of inclusive prices instead of adding it", () => {
    const result = calculateTaxServiceAndRounding([line(110, 10, "INCLUSIVE")], settings());
    expect(result.taxAmount).toBe(10);
    expect(result.totalAmount).toBe(110);
  });

  it("adds exclusive tax on top", () => {
    const result = calculateTaxServiceAndRounding([line(100, 10, "EXCLUSIVE")], settings());
    expect(result.taxAmount).toBe(10);
    expect(result.totalAmount).toBe(110);
  });

  it("handles inclusive and exclusive lines independently in the same order", () => {
    const result = calculateTaxServiceAndRounding([
      line(110, 10, "INCLUSIVE"),
      line(100, 10, "EXCLUSIVE"),
    ], settings());
    expect(result.taxAmount).toBe(20);
    expect(result.totalAmount).toBe(220);
  });
});
