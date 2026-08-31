import { beforeEach, describe, expect, it, vi } from "vitest";

const { price } = vi.hoisted(() => ({ price: vi.fn() }));
vi.mock("../../../orders/pricing/pricing-pipeline", async () => {
  const actual = await vi.importActual<typeof import("../../../orders/pricing/pricing-pipeline")>("../../../orders/pricing/pricing-pipeline");
  return { ...actual, pricingPipeline: { ...actual.pricingPipeline, price } };
});

import { previewComboConfiguration } from "../combo-builder.service";

const context = {
  tenantId: "tenant",
  branchId: "branch",
  channel: "STAFF" as const,
  fulfillmentType: "DINE_IN" as const,
  asOf: new Date("2026-08-30T12:00:00.000Z"),
};

const pricedLine = (menuItemId: string, unitPrice: number) => ({
  menuItemId,
  menuItemName: menuItemId,
  quantity: 1,
  unitPrice,
  subtotal: unitPrice,
  taxRate: 0,
  fulfillmentType: "DINE_IN" as const,
  modifiers: [],
  pricingAttribution: { BASE_PRICE: unitPrice, VARIANT: 0, MODIFIER: 0 },
});

describe("H4 guided combo preview", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("uses PricingPipeline stages 1-3 then the exact combo stage for fixed price + upcharge", async () => {
    price.mockResolvedValue({ lines: [pricedLine("main", 12), pricedLine("side", 5)], subtotal: 17, taxAmount: 0 });
    const result = await previewComboConfiguration(context, {
      pricePolicy: "FIXED",
      fixedPrice: 15,
      slots: [
        { name: "Main", minSelections: 1, maxSelections: 1, options: [{ menuItemId: "main" }] },
        { name: "Side", minSelections: 1, maxSelections: 1, options: [{ menuItemId: "side", upcharge: 2 }] },
      ],
    });
    expect(price).toHaveBeenCalledOnce();
    expect(result.componentTotal).toBe(17);
    expect(result.upcharges).toBe(2);
    expect(result.resolvedTotal).toBe(17);
  });

  it("matches percent-off combo policy without a parallel pricing formula", async () => {
    price.mockResolvedValue({ lines: [pricedLine("a", 20), pricedLine("b", 10)], subtotal: 30, taxAmount: 0 });
    const result = await previewComboConfiguration(context, {
      pricePolicy: "PERCENT_OFF_SUM",
      percentOff: 10,
      slots: [
        { name: "A", minSelections: 1, maxSelections: 1, options: [{ menuItemId: "a" }] },
        { name: "B", minSelections: 1, maxSelections: 1, options: [{ menuItemId: "b" }] },
      ],
    });
    expect(result.resolvedTotal).toBe(27);
  });
});
