import { beforeEach, describe, expect, it, vi } from "vitest";

const { price, finalize, findById, findCategory } = vi.hoisted(() => ({
  price: vi.fn(), finalize: vi.fn(), findById: vi.fn(), findCategory: vi.fn(),
}));
vi.mock("../../../orders/pricing/pricing-pipeline", () => ({
  pricingPipeline: { price, finalize },
}));
vi.mock("../../items/item.repository", () => ({
  itemRepository: { findById, findCategory },
}));
vi.mock("../promotion.repository", () => ({
  promotionRepository: {},
}));
vi.mock("../../change-log/menu-change-log", () => ({
  menuChangeLog: {},
  buildDiff: vi.fn(),
}));
vi.mock("../../menu-authorization", () => ({ assertMenuResourceBranch: vi.fn() }));
vi.mock("../../../../core/audit", () => ({ writeAudit: vi.fn() }));
vi.mock("../../../../core/auth", () => ({ requirePermission: vi.fn() }));

import { promotionService } from "../promotion.service";

const auth = {
  tenantId: "tenant",
  branchId: "branch",
  userId: "user",
  roles: [],
  permissions: [],
  tenantWide: false,
  authorizedBranchIds: ["branch"],
} as never;

const pricedLine = {
  menuItemId: "item",
  menuItemName: "Item",
  quantity: 1,
  unitPrice: 100,
  subtotal: 100,
  taxRate: 5,
  fulfillmentType: "DINE_IN" as const,
  modifiers: [],
  pricingAttribution: { BASE_PRICE: 100, VARIANT: 0, MODIFIER: 0 },
};

describe("H4 promotion preview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    price.mockResolvedValue({ lines: [pricedLine], subtotal: 100, taxAmount: 5 });
    finalize.mockResolvedValue({
      lines: [pricedLine], subtotal: 100, discountAmount: 20, taxAmount: 4,
      serviceChargeAmount: 0, roundingAdjustment: 0, totalAmount: 84,
    });
  });

  it("passes an unsaved candidate into the authoritative final pricing pipeline", async () => {
    const result = await promotionService.preview(auth, {
      promotion: { name: "Lunch 20", ruleType: "PERCENTAGE", scope: "ORDER", value: 20 },
      items: [{ menuItemId: "item", quantity: 1 }],
    });
    expect(price).toHaveBeenCalledOnce();
    expect(finalize).toHaveBeenCalledOnce();
    const options = finalize.mock.calls[0]![2];
    expect(options.promotionIds).toHaveLength(1);
    expect(options.candidatePromotions).toHaveLength(1);
    expect(options.candidatePromotions[0]).toMatchObject({
      tenantId: "tenant", name: "Lunch 20", ruleType: "PERCENTAGE", value: "20.00", isActive: true,
    });
    expect(result.discountAmount).toBe(20);
    expect(result.totalAmount).toBe(84);
  });
});
