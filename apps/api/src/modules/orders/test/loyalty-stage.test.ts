import { beforeEach, describe, expect, it, vi } from "vitest";

const { findCandidates, findCustomer, findOrganizationTierForCustomer } = vi.hoisted(() => ({
  findCandidates: vi.fn(),
  findCustomer: vi.fn(),
  findOrganizationTierForCustomer: vi.fn(),
}));
vi.mock("../../menu/promotions/promotion.repository", () => ({ promotionRepository: { findCandidates } }));
vi.mock("../../loyalty/loyalty.repository", () => ({ loyaltyRepository: { findCustomer, findOrganizationTierForCustomer } }));

import { applyDiscountStages, applyLoyaltyDiscount } from "../pricing/loyalty-stage";
import type { PricedLine, PricingContext } from "../pricing/pricing-pipeline";

const context: PricingContext = { tenantId: "tenant", branchId: "branch", channel: "STAFF", fulfillmentType: "DINE_IN", customerId: "customer", asOf: new Date("2026-08-29T12:00:00.000Z") };
const line = (subtotal: number): PricedLine => ({ menuItemId: "item", menuItemName: "Item", quantity: 1, unitPrice: subtotal, subtotal, taxRate: 10, fulfillmentType: "DINE_IN", modifiers: [], pricingAttribution: { BASE_PRICE: subtotal, VARIANT: 0, MODIFIER: 0 } });
const promo = (overrides: Record<string, unknown> = {}) => ({
  id: "promo", tenantId: "tenant", name: "Promo", ruleType: "PERCENTAGE", scope: "ORDER", scopeCategoryId: null, scopeMenuItemId: null,
  value: "20", couponCode: null, startDate: null, endDate: null, startTime: null, endTime: null, maxUsesTotal: null, maxUsesPerCustomer: null,
  triggerMenuItemId: null, triggerCategoryId: null, rewardMenuItemId: null, rewardCategoryId: null, rewardDiscountPercent: null, triggerQuantity: null, rewardQuantity: null,
  stackableWithLoyalty: true, isActive: true, createdAt: new Date(), updatedAt: new Date(), ...overrides,
});
const customer = (discountPercent: string | null, discountFixed: string | null) => ({
  id: "customer", tenantId: "tenant", name: "A", email: null, phone: null, loyaltyTierId: "tier", createdAt: new Date(), updatedAt: new Date(),
  loyaltyTier: { id: "tier", tenantId: "tenant", name: "Gold", discountPercent, discountFixed, createdAt: new Date(), updatedAt: new Date() },
});

describe("D6 fixed loyalty allocation", () => {
  it("applies a fixed tier discount once across the whole order and preserves exact cents", () => {
    const result = applyLoyaltyDiscount([line(60), line(40)], customer(null, "10").loyaltyTier);
    expect(result.loyaltyDiscountAmount).toBe(10);
    expect(result.lines.reduce((sum, priced) => sum + Math.max(0, -(priced.pricingAttribution.LOYALTY ?? 0)), 0)).toBe(10);
  });
});

describe("pricing pipeline stage 6 loyalty", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findOrganizationTierForCustomer.mockResolvedValue(undefined);
  });

  it("uses an organization-level tier at a sibling tenant when identity resolution finds it", async () => {
    findCandidates.mockResolvedValue([]);
    findCustomer.mockResolvedValue({ ...customer(null, null), loyaltyTier: null });
    findOrganizationTierForCustomer.mockResolvedValue({
      id: "org-tier", tenantId: null, organizationId: "org", name: "Group Gold",
      discountPercent: "15", discountFixed: null, createdAt: new Date(), updatedAt: new Date(),
    });
    const result = await applyDiscountStages(context, [line(100)], { customerId: "customer" });
    expect(result.loyaltyDiscountAmount).toBe(15);
    expect(result.lines[0]!.pricingAttribution.LOYALTY_DETAILS?.tierId).toBe("org-tier");
  });

  it("stacks a loyalty discount after a stackable promotion", async () => {
    findCandidates.mockResolvedValue([promo({ value: "20", stackableWithLoyalty: true })]);
    findCustomer.mockResolvedValue(customer("10", null));
    const result = await applyDiscountStages(context, [line(100)], { customerId: "customer" });
    expect(result.discountAmount).toBe(28);
    expect(result.loyaltyDiscountAmount).toBe(8);
    expect(result.lines[0]!.pricingAttribution.PROMOTION).toBe(-20);
    expect(result.lines[0]!.pricingAttribution.LOYALTY).toBe(-8);
  });

  it("keeps the larger non-stackable promotion instead of loyalty", async () => {
    findCandidates.mockResolvedValue([promo({ value: "30", stackableWithLoyalty: false })]);
    findCustomer.mockResolvedValue(customer("20", null));
    const result = await applyDiscountStages(context, [line(100)], { customerId: "customer" });
    expect(result.discountAmount).toBe(30);
    expect(result.loyaltyDiscountAmount).toBe(0);
    expect(result.lines[0]!.pricingAttribution.LOYALTY).toBeUndefined();
  });

  it("compares loyalty with the highest single non-stackable promotion, not their sum", async () => {
    findCandidates.mockResolvedValue([
      promo({ id: "p10", value: "10", stackableWithLoyalty: false }),
      promo({ id: "p15", value: "15", stackableWithLoyalty: false }),
    ]);
    findCustomer.mockResolvedValue(customer("20", null));
    const result = await applyDiscountStages(context, [line(100)], { customerId: "customer" });
    expect(result.discountAmount).toBe(20);
    expect(result.loyaltyDiscountAmount).toBe(20);
    expect(result.lines[0]!.pricingAttribution.PROMOTION).toBeUndefined();
    expect(result.lines[0]!.pricingAttribution.LOYALTY).toBe(-20);
    expect(result.redemptions).toEqual([]);
  });

  it("drops a smaller non-stackable promotion when loyalty is larger", async () => {
    findCandidates.mockResolvedValue([promo({ value: "10", stackableWithLoyalty: false })]);
    findCustomer.mockResolvedValue(customer("20", null));
    const result = await applyDiscountStages(context, [line(100)], { customerId: "customer" });
    expect(result.discountAmount).toBe(20);
    expect(result.loyaltyDiscountAmount).toBe(20);
    expect(result.lines[0]!.pricingAttribution.PROMOTION).toBeUndefined();
    expect(result.lines[0]!.pricingAttribution.LOYALTY).toBe(-20);
    expect(result.redemptions).toEqual([]);
  });
});
