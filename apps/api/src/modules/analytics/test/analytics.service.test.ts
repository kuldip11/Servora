import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  countOrdersSince,
  sumPaidRevenueSince,
  countActiveOrders,
  findActiveInventoryItems,
  findTopItems,
  revenueByHour,
  countPaidOrdersSince,
  countCancelledOrdersSince,
  findCostReportItems,
  salesVolumeByItem,
} = vi.hoisted(() => ({
  countOrdersSince: vi.fn(),
  sumPaidRevenueSince: vi.fn(),
  countActiveOrders: vi.fn(),
  findActiveInventoryItems: vi.fn(),
  findTopItems: vi.fn(),
  revenueByHour: vi.fn(),
  countPaidOrdersSince: vi.fn(),
  countCancelledOrdersSince: vi.fn(),
  findCostReportItems: vi.fn(),
  salesVolumeByItem: vi.fn(),
}));

vi.mock("../analytics.repository", () => ({
  analyticsRepository: {
    countOrdersSince,
    sumPaidRevenueSince,
    countActiveOrders,
    findActiveInventoryItems,
    findTopItems,
    revenueByHour,
    countPaidOrdersSince,
    countCancelledOrdersSince,
    findCostReportItems,
    salesVolumeByItem,
  },
}));

const { computeRecipeCosts } = vi.hoisted(() => ({
  computeRecipeCosts: vi.fn(),
}));
vi.mock("../../inventory/inventory.service", () => ({
  inventoryService: { computeRecipeCosts },
}));

const { price } = vi.hoisted(() => ({ price: vi.fn() }));
vi.mock("../../orders/pricing/pricing-pipeline", () => ({
  pricingPipeline: { price },
}));

import { analyticsService } from "@/modules/analytics/analytics.service";
import type { AuthContext } from "@/core/auth";

const auth = (overrides: Partial<AuthContext> = {}): AuthContext => ({
  userId: "u1",
  tenantId: "t1",
  branchId: "b1",
  email: "u@example.com",
  roles: [],
  permissions: ["analytics:read"],
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  countOrdersSince.mockResolvedValue(5);
  sumPaidRevenueSince.mockResolvedValue(125.5);
  countActiveOrders.mockResolvedValue(2);
  findTopItems.mockResolvedValue([]);
  revenueByHour.mockResolvedValue([]);
  countPaidOrdersSince.mockResolvedValue(4);
  countCancelledOrdersSince.mockResolvedValue(1);
  findActiveInventoryItems.mockResolvedValue([
    { currentStock: "2", minimumStock: "5", isActive: true },
    { currentStock: "10", minimumStock: "5", isActive: true },
    { currentStock: "5", minimumStock: "5", isActive: true },
  ]);
});

describe("analytics service", () => {
  it("requires permission and scope before querying", async () => {
    await expect(
      analyticsService.getDashboard(auth({ permissions: [] })),
    ).rejects.toThrow(/Insufficient permissions|access denied/);
    await expect(
      analyticsService.getDashboard(
        auth({ branchId: null, tenantWide: false }),
      ),
    ).rejects.toThrow(/Insufficient permissions|access denied/);
    expect(countOrdersSince).not.toHaveBeenCalled();
  });

  it("assembles dashboard metrics and counts low-stock inventory inclusively", async () => {
    const result = await analyticsService.getDashboard(auth());
    expect(result).toEqual({
      totalOrdersToday: 5,
      revenueToday: 125.5,
      activeOrders: 2,
      lowStockAlerts: 2,
      topItems: [],
      revenueByHour: [],
      paidOrdersToday: 4,
      cancelledOrdersToday: 1,
      averageOrderValue: 31.375,
    });
    expect(countOrdersSince).toHaveBeenCalledWith("t1", "b1", expect.any(Date));
    expect(sumPaidRevenueSince).toHaveBeenCalledWith(
      "t1",
      "b1",
      expect.any(Date),
    );
  });

  it("passes null branch through for tenant-wide aggregates", async () => {
    await analyticsService.getDashboard(
      auth({ branchId: null, tenantWide: true }),
    );
    expect(countOrdersSince).toHaveBeenCalledWith("t1", null, expect.any(Date));
    expect(findActiveInventoryItems).toHaveBeenCalledWith("t1", null);
  });

  it("E6 calculates margin from the authoritative resolved price, not base price", async () => {
    findCostReportItems.mockResolvedValue([
      {
        id: "m1",
        name: "Pasta",
        categoryId: "c1",
        category: { name: "Mains" },
        basePrice: "999.00",
        manualCost: "70.00",
        variants: [{ id: "v1", name: "Large" }],
      },
    ]);
    computeRecipeCosts.mockResolvedValue([40, 55]);
    price.mockResolvedValue({
      lines: [{ unitPrice: 100 }, { unitPrice: 140 }],
    });

    const result = await analyticsService.getCostMarginReport(auth(), "c1");

    expect(findCostReportItems).toHaveBeenCalledWith("t1", "b1", "c1");
    expect(computeRecipeCosts).toHaveBeenCalledTimes(1);
    expect(computeRecipeCosts).toHaveBeenCalledWith("t1", "b1", [
      { menuItemId: "m1", quantity: 1 },
      { menuItemId: "m1", variantId: "v1", quantity: 1 },
    ]);
    expect(price).toHaveBeenCalledTimes(1);
    expect(price).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "t1",
        branchId: "b1",
        channel: "STAFF",
        fulfillmentType: "DINE_IN",
        asOf: expect.any(Date),
        allowUnavailable: true,
        allowIncompleteModifierSelection: true,
      }),
      [
        { menuItemId: "m1", quantity: 1 },
        { menuItemId: "m1", variantId: "v1", quantity: 1 },
      ],
    );
    expect(result).toEqual([
      expect.objectContaining({
        variantId: "v1",
        price: 140,
        manualCost: 70,
        recipeCost: 55,
        effectiveCost: 55,
        costSource: "RECIPE",
        cost: 55,
        margin: 85,
        marginPercent: 60.71,
      }),
      expect.objectContaining({
        variantId: null,
        price: 100,
        manualCost: 70,
        recipeCost: 40,
        effectiveCost: 40,
        costSource: "RECIPE",
        cost: 40,
        margin: 60,
        marginPercent: 60,
      }),
    ]);
  });

  it("uses manual cost when recipe cost is missing and preserves unknown cost", async () => {
    findCostReportItems.mockResolvedValue([
      {
        id: "manual",
        name: "Manual",
        categoryId: "c1",
        category: { name: "Mains" },
        manualCost: "25.00",
        variants: [],
      },
      {
        id: "unknown",
        name: "Unknown",
        categoryId: "c1",
        category: { name: "Mains" },
        manualCost: null,
        variants: [],
      },
      {
        id: "zero",
        name: "Zero",
        categoryId: "c1",
        category: { name: "Mains" },
        manualCost: "0.00",
        variants: [],
      },
    ]);
    computeRecipeCosts.mockResolvedValue([null, null, null]);
    price.mockResolvedValue({
      lines: [{ unitPrice: 100 }, { unitPrice: 80 }, { unitPrice: 50 }],
    });

    const result = await analyticsService.getCostMarginReport(auth());

    expect(result).toEqual([
      expect.objectContaining({
        menuItemId: "zero",
        costSource: "MANUAL",
        cost: 0,
        margin: 50,
        marginPercent: 100,
      }),
      expect.objectContaining({
        menuItemId: "manual",
        costSource: "MANUAL",
        cost: 25,
        margin: 75,
        marginPercent: 75,
      }),
      expect.objectContaining({
        menuItemId: "unknown",
        costSource: "UNKNOWN",
        cost: null,
        margin: null,
        marginPercent: null,
      }),
    ]);
  });

  it("E6 requires a concrete branch because ingredient costs are branch-scoped", async () => {
    await expect(
      analyticsService.getCostMarginReport(
        auth({ branchId: null, tenantWide: true }),
      ),
    ).rejects.toThrow("Select a branch");
    expect(findCostReportItems).not.toHaveBeenCalled();
  });
});

describe("H3 menu-engineering report", () => {
  it("uses the requested analysis window and classifies actual margin/volume pairs", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-30T12:00:00.000Z"));
    const marginSpy = vi
      .spyOn(analyticsService, "getCostMarginReport")
      .mockResolvedValue([
        {
          menuItemId: "star",
          menuItemName: "Star",
          categoryId: "c",
          categoryName: "C",
          variantId: null,
          variantName: null,
          price: 150,
          manualCost: null,
          recipeCost: 50,
          effectiveCost: 50,
          costSource: "RECIPE",
          cost: 50,
          margin: 100,
          marginPercent: 66.67,
        },
        {
          menuItemId: "puzzle",
          menuItemName: "Puzzle",
          categoryId: "c",
          categoryName: "C",
          variantId: null,
          variantName: null,
          price: 140,
          manualCost: null,
          recipeCost: 50,
          effectiveCost: 50,
          costSource: "RECIPE",
          cost: 50,
          margin: 90,
          marginPercent: 64.29,
        },
        {
          menuItemId: "plow",
          menuItemName: "Plow",
          categoryId: "c",
          categoryName: "C",
          variantId: null,
          variantName: null,
          price: 70,
          manualCost: null,
          recipeCost: 50,
          effectiveCost: 50,
          costSource: "RECIPE",
          cost: 50,
          margin: 20,
          marginPercent: 28.57,
        },
        {
          menuItemId: "dog",
          menuItemName: "Dog",
          categoryId: "c",
          categoryName: "C",
          variantId: null,
          variantName: null,
          price: 60,
          manualCost: null,
          recipeCost: 50,
          effectiveCost: 50,
          costSource: "RECIPE",
          cost: 50,
          margin: 10,
          marginPercent: 16.67,
        },
      ]);
    salesVolumeByItem.mockResolvedValue([
      { menuItemId: "star", variantId: null, volume: 100 },
      { menuItemId: "puzzle", variantId: null, volume: 2 },
      { menuItemId: "plow", variantId: null, volume: 80 },
      { menuItemId: "dog", variantId: null, volume: 1 },
    ]);

    const result = await analyticsService.getMenuEngineeringReport(auth(), 30);

    expect(salesVolumeByItem).toHaveBeenCalledWith(
      "t1",
      "b1",
      new Date("2026-07-31T12:00:00.000Z"),
    );
    expect(result.map((row) => [row.menuItemId, row.quadrant])).toEqual([
      ["star", "STAR"],
      ["puzzle", "PUZZLE"],
      ["plow", "PLOWHORSE"],
      ["dog", "DOG"],
    ]);

    marginSpy.mockRestore();
    vi.useRealTimers();
  });

  it("rejects unsupported windows instead of silently changing the period", async () => {
    await expect(
      analyticsService.getMenuEngineeringReport(auth(), 6),
    ).rejects.toThrow("Window must be between 7 and 365 days");
    await expect(
      analyticsService.getMenuEngineeringReport(auth(), 366),
    ).rejects.toThrow("Window must be between 7 and 365 days");
  });
});
