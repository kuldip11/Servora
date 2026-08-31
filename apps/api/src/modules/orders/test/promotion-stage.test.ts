import { beforeEach, describe, expect, it, vi } from "vitest";

const { findCandidates } = vi.hoisted(() => ({
  findCandidates: vi.fn(),
}));
vi.mock("../../menu/promotions/promotion.repository", () => ({
  promotionRepository: { findCandidates },
}));
import { applyPromotionStage } from "@/modules/orders/pricing/promotion-stage";
import type {
  PricedLine,
  PricingContext,
} from "@/modules/orders/pricing/pricing-pipeline";
import type { PromotionRow } from "@/modules/menu/promotions/promotion.repository";

const context: PricingContext = {
  tenantId: "tenant",
  branchId: "branch",
  channel: "STAFF",
  fulfillmentType: "DINE_IN",
  asOf: new Date("2026-08-29T12:00:00.000Z"),
};
const categoryByItem: Record<string, string> = {
  "item-a": "cat-a",
  "item-b": "cat-b",
  "item-c": "cat-a",
};
const line = (id: string, subtotal: number, taxRate = 5): PricedLine => ({
  menuItemId: id,
  menuItemName: id,
  quantity: 1,
  unitPrice: subtotal,
  subtotal,
  taxRate,
  fulfillmentType: "DINE_IN",
  modifiers: [],
  pricingAttribution: {
    BASE_PRICE: subtotal,
    VARIANT: 0,
    MODIFIER: 0,
    ...(categoryByItem[id] ? { CATEGORY_ID: categoryByItem[id] } : {}),
  },
});
const promotion = (overrides: Partial<PromotionRow> = {}): PromotionRow => ({
  id: "promo-1",
  tenantId: "tenant",
  name: "20% off",
  ruleType: "PERCENTAGE",
  scope: "ORDER",
  scopeCategoryId: null,
  scopeMenuItemId: null,
  value: "20.00",
  couponCode: null,
  startDate: null,
  endDate: null,
  startTime: null,
  endTime: null,
  maxUsesTotal: null,
  maxUsesPerCustomer: null,
  triggerMenuItemId: null,
  triggerCategoryId: null,
  rewardMenuItemId: null,
  rewardCategoryId: null,
  rewardDiscountPercent: null,
  triggerQuantity: null,
  rewardQuantity: null,
  stackableWithLoyalty: true,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe("pricing pipeline stage 5 promotions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("previews an unsaved promotion through the same stage without consulting persisted candidates", async () => {
    const preview = promotion({
      id: "preview",
      value: "25.00",
      name: "Unsaved 25%",
    });
    const result = await applyPromotionStage(context, [line("item-a", 80)], {
      promotionIds: ["preview"],
      candidatePromotions: [preview],
    });
    expect(findCandidates).not.toHaveBeenCalled();
    expect(result.discountAmount).toBe(20);
    expect(result.lines[0]!.pricingAttribution.PROMOTION_DETAILS).toEqual([
      { promotionId: "preview", name: "Unsaved 25%", discountAmount: 20 },
    ]);
  });

  it("discounts the post-combo/modifier subtotal and writes line attribution", async () => {
    findCandidates.mockResolvedValue([promotion()]);
    const comboChild = line("item-a", 80);
    comboChild.pricingAttribution.COMBO = -20;
    const result = await applyPromotionStage(context, [
      comboChild,
      line("item-b", 20),
    ]);
    expect(result.subtotal).toBe(100);
    expect(result.discountAmount).toBe(20);
    expect(result.taxAmount).toBe(4);
    expect(result.lines[0]!.pricingAttribution.PROMOTION_DETAILS).toEqual([
      { promotionId: "promo-1", name: "20% off", discountAmount: 16 },
    ]);
    expect(result.redemptions).toEqual([
      { promotionId: "promo-1", customerId: null, discountAmount: 20 },
    ]);
  });

  it("honors ITEM and CATEGORY scopes", async () => {
    findCandidates.mockResolvedValue([
      promotion({
        id: "item-promo",
        name: "item",
        scope: "ITEM",
        scopeMenuItemId: "item-a",
        value: "10",
      }),
      promotion({
        id: "category-promo",
        name: "category",
        scope: "CATEGORY",
        scopeCategoryId: "cat-b",
        value: "50",
      }),
    ]);
    const result = await applyPromotionStage(context, [
      line("item-a", 100),
      line("item-b", 100),
    ]);
    expect(result.discountAmount).toBe(60);
    expect(result.lines[0]!.pricingAttribution.PROMOTION).toBe(-10);
    expect(result.lines[1]!.pricingAttribution.PROMOTION).toBe(-50);
  });

  it("allocates a fixed amount deterministically without losing a cent", async () => {
    findCandidates.mockResolvedValue([
      promotion({ ruleType: "FIXED_AMOUNT", value: "1.00" }),
    ]);
    const result = await applyPromotionStage(context, [
      line("item-a", 1),
      line("item-b", 1),
      line("item-c", 1),
    ]);
    const discounts = result.lines.map(
      (value) => -(value.pricingAttribution.PROMOTION ?? 0),
    );
    expect(discounts).toEqual([0.34, 0.33, 0.33]);
    expect(discounts.reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 8);
  });

  it("does not reapply an already-consumed fixed order discount on a later round", async () => {
    findCandidates.mockResolvedValue([
      promotion({ ruleType: "FIXED_AMOUNT", value: "50.00" }),
    ]);
    const result = await applyPromotionStage(context, [line("item-a", 100)], {
      priorRedemptions: { "promo-1": 50 },
      promotionIds: ["promo-1"],
    });
    expect(result.discountAmount).toBe(0);
    expect(result.redemptions).toEqual([]);
  });

  it("rejects an invalid requested coupon instead of silently ignoring it", async () => {
    findCandidates.mockResolvedValue([promotion({ couponCode: "SAVE20" })]);
    await expect(
      applyPromotionStage(context, [line("item-a", 100)], {
        couponCode: "BAD",
      }),
    ).rejects.toThrow("Coupon code is invalid or inactive");
  });

  it("BOGO buy-2-get-1 requires the full trigger plus reward quantity", async () => {
    findCandidates.mockResolvedValue([
      promotion({
        ruleType: "BOGO",
        value: null,
        name: "Buy 2 get 1",
        triggerMenuItemId: "item-a",
        rewardDiscountPercent: "100",
        triggerQuantity: 2,
        rewardQuantity: 1,
      }),
    ]);
    const below = await applyPromotionStage(context, [
      { ...line("item-a", 200), quantity: 2, unitPrice: 100 },
    ]);
    expect(below.discountAmount).toBe(0);
    const exact = await applyPromotionStage(context, [
      { ...line("item-a", 300), quantity: 3, unitPrice: 100 },
    ]);
    expect(exact.discountAmount).toBe(100);
    const above = await applyPromotionStage(context, [
      { ...line("item-a", 400), quantity: 4, unitPrice: 100 },
    ]);
    expect(above.discountAmount).toBe(100);
  });

  it("BOGO never reuses one overlapping unit as both trigger and reward", async () => {
    findCandidates.mockResolvedValue([
      promotion({
        ruleType: "BOGO",
        value: null,
        name: "Buy pizza get Margherita",
        triggerCategoryId: "cat-a",
        rewardMenuItemId: "item-a",
        rewardDiscountPercent: "100",
        triggerQuantity: 1,
        rewardQuantity: 1,
      }),
    ]);
    const oneOverlappingUnit = line("item-a", 100);
    oneOverlappingUnit.pricingAttribution.CATEGORY_ID = "cat-a";
    const below = await applyPromotionStage(context, [oneOverlappingUnit]);
    expect(below.discountAmount).toBe(0);

    const triggerOnly = line("item-c", 120);
    triggerOnly.pricingAttribution.CATEGORY_ID = "cat-a";
    const reward = line("item-a", 80);
    reward.pricingAttribution.CATEGORY_ID = "cat-a";
    const exact = await applyPromotionStage(context, [triggerOnly, reward]);
    expect(exact.discountAmount).toBe(80);
    expect(exact.lines[1]!.pricingAttribution.PROMOTION).toBe(-80);
  });

  it("BOGO discounts the lowest-priced eligible reward unit first", async () => {
    findCandidates.mockResolvedValue([
      promotion({
        ruleType: "BOGO",
        value: null,
        name: "Buy A get B",
        triggerMenuItemId: "item-a",
        rewardMenuItemId: "item-b",
        rewardDiscountPercent: "100",
        triggerQuantity: 1,
        rewardQuantity: 1,
      }),
    ]);
    const result = await applyPromotionStage(context, [
      line("item-a", 120),
      { ...line("item-b", 160), quantity: 2, unitPrice: 80 },
      line("item-b", 50),
    ]);
    expect(result.discountAmount).toBe(50);
    expect(result.lines[2]!.pricingAttribution.PROMOTION).toBe(-50);
    expect(result.lines[1]!.pricingAttribution.PROMOTION).toBeUndefined();
  });
});
