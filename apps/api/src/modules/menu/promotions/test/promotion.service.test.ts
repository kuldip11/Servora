import { beforeEach, describe, expect, it, vi } from "vitest";
const { create, list, findById, update, remove, findItem, findCategory } =
  vi.hoisted(() => ({
    create: vi.fn(),
    list: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    findItem: vi.fn(),
    findCategory: vi.fn(),
  }));
vi.mock("../promotion.repository", () => ({
  promotionRepository: {
    create,
    list,
    findById,
    update,
    remove,
    stats: vi.fn(),
  },
}));
vi.mock("../../change-log/menu-change-log", () => ({
  menuChangeLog: { record: vi.fn() },
  buildDiff: vi.fn(() => ({})),
}));
vi.mock("../../items/item.repository", () => ({
  itemRepository: { findById: findItem, findCategory },
}));
vi.mock("../../../../core/auth", async () => {
  const actual = await vi.importActual<typeof import("../../../../core/auth")>(
    "../../../../core/auth",
  );
  return { ...actual, requirePermission: vi.fn() };
});
import { promotionService } from "@/modules/menu/promotions/promotion.service";
import type { AuthContext } from "@/core/auth";
const auth: AuthContext = {
  tenantId: "tenant",
  userId: "user",
  membershipId: "membership",
  branchId: null,
  email: "user@example.com",
  roles: [],
  permissions: ["menu:update", "menu:read"],
};
describe("promotionService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findItem.mockResolvedValue({ id: "item-a", branchId: null });
    findCategory.mockResolvedValue({ id: "cat-a", branchId: null });
  });
  it("normalizes coupon codes and persists percentage promotions", async () => {
    create.mockImplementation(async (input) => ({ ...input, id: "p1" }));
    const result = await promotionService.create(auth, {
      name: "Summer",
      ruleType: "PERCENTAGE",
      scope: "ORDER",
      value: 20,
      couponCode: " save20 ",
    });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "tenant",
        couponCode: "SAVE20",
        value: "20.00",
      }),
    );
    expect(result.id).toBe("p1");
  });
  it("rejects invalid scope targets and percentages above 100", async () => {
    await expect(
      promotionService.create(auth, {
        name: "bad",
        ruleType: "PERCENTAGE",
        scope: "ORDER",
        value: 101,
      }),
    ).rejects.toThrow();
    await expect(
      promotionService.create(auth, {
        name: "bad",
        ruleType: "FIXED_AMOUNT",
        scope: "ITEM",
        value: 10,
      }),
    ).rejects.toThrow();
  });
  it("rejects item/category targets that do not belong to the authenticated tenant", async () => {
    findItem.mockResolvedValueOnce(undefined);
    await expect(
      promotionService.create(auth, {
        name: "foreign item",
        ruleType: "FIXED_AMOUNT",
        scope: "ITEM",
        value: 10,
        scopeMenuItemId: "foreign-item",
      }),
    ).rejects.toThrow(/does not belong to this tenant/i);

    findCategory.mockResolvedValueOnce(undefined);
    await expect(
      promotionService.create(auth, {
        name: "foreign category",
        ruleType: "PERCENTAGE",
        scope: "CATEGORY",
        value: 10,
        scopeCategoryId: "foreign-category",
      }),
    ).rejects.toThrow(/does not belong to this tenant/i);
  });

  it("rejects BOGO configurations that also use the generic promotion scope", async () => {
    await expect(
      promotionService.create(auth, {
        name: "Bad scoped BOGO",
        ruleType: "BOGO",
        scope: "ITEM",
        scopeMenuItemId: "item-a",
        triggerMenuItemId: "item-a",
        rewardDiscountPercent: 100,
        triggerQuantity: 1,
        rewardQuantity: 1,
      }),
    ).rejects.toThrow(/must use ORDER scope/i);
  });

  it("validates and persists BOGO pairing fields without a flat value", async () => {
    create.mockImplementation(async (input) => ({ ...input, id: "bogo" }));
    await promotionService.create(auth, {
      name: "Buy 2 get 1",
      ruleType: "BOGO",
      scope: "ORDER",
      triggerMenuItemId: "item-a",
      rewardDiscountPercent: 100,
      triggerQuantity: 2,
      rewardQuantity: 1,
    });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "tenant",
        ruleType: "BOGO",
        value: null,
        triggerMenuItemId: "item-a",
        rewardDiscountPercent: "100.00",
        triggerQuantity: 2,
        rewardQuantity: 1,
      }),
    );
  });
});
