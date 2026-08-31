import { beforeEach, describe, expect, it, vi } from "vitest";

const { finalize } = vi.hoisted(() => ({ finalize: vi.fn() }));
vi.mock("../pricing/pricing-pipeline", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../pricing/pricing-pipeline")>()),
  pricingPipeline: { finalize },
}));

import {
  finalizeWholeActiveOrder,
  storedOrderLineToStage4Snapshot,
  type StoredOrderLineForRepricing,
} from "../order-repricing";
import type { PricedLine, PricingContext, PricingReplayEvidence } from "../pricing/pricing-pipeline";

const context: PricingContext = {
  tenantId: "tenant-1",
  branchId: "branch-1",
  channel: "STAFF",
  fulfillmentType: "DINE_IN",
  asOf: new Date("2026-08-30T12:00:00.000Z"),
};


const pricingReplayEvidence: PricingReplayEvidence = {
  requestedLine: { menuItemId: "item-1", quantity: 1 },
  item: {
    id: "item-1", branchId: null, name: "Historical Burger", categoryId: "cat-1",
    isAvailable: true, basePrice: "120.00", taxRate: "5.00", variants: [], modifierGroupLinks: [],
  },
  branchOverride: null,
  priceRules: [],
};

const storedLine: StoredOrderLineForRepricing = {
  id: "old-line",
  menuItemId: "item-1",
  menuItemName: "Historical Burger",
  variantId: null,
  variantName: null,
  quantity: 1,
  unitPrice: "120.00",
  subtotal: "120.00",
  taxRate: "5.00",
  taxMode: "EXCLUSIVE",
  fulfillmentType: "DINE_IN",
  pricingReplayEvidence,
  pricingAttribution: {
    BASE_PRICE: 150,
    VARIANT: 0,
    MODIFIER: 0,
    PROMOTION: -20,
    PROMOTION_DETAILS: [{ promotionId: "old-promo", name: "Old", discountAmount: 20 }],
    LOYALTY: -10,
    LOYALTY_DETAILS: { tierId: "tier-1", name: "Gold", discountAmount: 10 },
    TAXABLE_BASE: 90,
    CATEGORY_ID: "historical-category",
  },
  modifiers: [],
};

const newLine: PricedLine = {
  menuItemId: "item-2",
  menuItemName: "New Fries",
  quantity: 1,
  unitPrice: 50,
  subtotal: 50,
  taxRate: 5,
  fulfillmentType: "DINE_IN",
  modifiers: [],
  pricingAttribution: { BASE_PRICE: 50, VARIANT: 0, MODIFIER: 0, CATEGORY_ID: "sides" },
};

beforeEach(() => { vi.clearAllMocks(); });

describe("whole-active-order repricing", () => {
  it("reconstructs historical lines from stored stage-1-through-4 snapshots only", () => {
    expect(storedOrderLineToStage4Snapshot(storedLine)).toMatchObject({
      menuItemId: "item-1",
      menuItemName: "Historical Burger",
      unitPrice: 120,
      subtotal: 120,
      taxRate: 5,
      pricingReplayEvidence,
      pricingAttribution: {
        BASE_PRICE: 150,
        VARIANT: 0,
        MODIFIER: 0,
        CATEGORY_ID: "historical-category",
      },
    });
    const attribution = storedOrderLineToStage4Snapshot(storedLine).pricingAttribution;
    expect(attribution.PROMOTION).toBeUndefined();
    expect(attribution.PROMOTION_DETAILS).toBeUndefined();
    expect(attribution.LOYALTY).toBeUndefined();
    expect(attribution.LOYALTY_DETAILS).toBeUndefined();
    expect(attribution.TAXABLE_BASE).toBeUndefined();
  });

  it("runs stages 5-9 once across existing and newly-fired lines and maps updates back to persisted lines", async () => {
    const repricedOld = storedOrderLineToStage4Snapshot(storedLine);
    repricedOld.pricingAttribution.PROMOTION = -10;
    const repricedNew = { ...newLine, pricingAttribution: { ...newLine.pricingAttribution, PROMOTION: -5 } };
    finalize.mockResolvedValue({
      lines: [repricedOld, repricedNew],
      subtotal: 170,
      discountAmount: 15,
      taxAmount: 7.75,
      serviceChargeAmount: 0,
      roundingAdjustment: 0,
      totalAmount: 162.75,
      preciseTotal: 162.75,
      roundingPolicy: "NONE",
      loyaltyDiscountAmount: 0,
      redemptions: [{ promotionId: "promo-1", customerId: null, discountAmount: 15 }],
      appliedPromotions: [{ promotionId: "promo-1", stackableWithLoyalty: true, discountAmount: 15 }],
    });

    const result = await finalizeWholeActiveOrder(context, [storedLine], [newLine], {
      promotionIds: ["promo-1"],
    });

    expect(finalize).toHaveBeenCalledWith(
      context,
      [
        expect.objectContaining({ menuItemName: "Historical Burger", subtotal: 120 }),
        newLine,
      ],
      { promotionIds: ["promo-1"] },
    );
    expect(result.existingPricingUpdates).toEqual([
      expect.objectContaining({
        id: "old-line",
        taxMode: "EXCLUSIVE",
        pricingAttribution: expect.objectContaining({ PROMOTION: -10 }),
      }),
    ]);
    expect(result.newLines).toEqual([repricedNew]);
    expect(result.totalAmount).toBe(162.75);
  });
});
