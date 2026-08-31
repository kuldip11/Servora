import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { salesVolumeByItem } = vi.hoisted(() => ({
  salesVolumeByItem: vi.fn(),
}));
vi.mock("../analytics.repository", () => ({
  analyticsRepository: { salesVolumeByItem },
}));
vi.mock("../analytics-authorization", () => ({
  requireAnalyticsPermission: vi.fn(),
  assertAnalyticsScope: vi.fn(),
}));
vi.mock("../../inventory/inventory.service", () => ({ inventoryService: {} }));
vi.mock("../../orders/pricing/pricing-pipeline", () => ({
  pricingPipeline: {},
}));

import { analyticsService } from "@/modules/analytics/analytics.service";

const auth = {
  tenantId: "tenant",
  branchId: "branch",
  userId: "user",
  roles: [],
  permissions: [],
  tenantWide: false,
  authorizedBranchIds: ["branch"],
} as never;

const marginRow = (menuItemId: string, margin: number) => ({
  menuItemId,
  menuItemName: menuItemId,
  categoryId: "cat",
  categoryName: "Category",
  variantId: null,
  variantName: null,
  price: 100,
  cost: 100 - margin,
  margin,
  marginPercent: margin,
});

describe("H3 menu-engineering report", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-30T12:00:00.000Z"));
    vi.spyOn(analyticsService, "getCostMarginReport").mockResolvedValue([
      marginRow("star", 20),
      marginRow("puzzle", 20),
      marginRow("plowhorse", 5),
      marginRow("dog", 5),
    ]);
    salesVolumeByItem.mockResolvedValue([
      { menuItemId: "star", variantId: null, volume: 20 },
      { menuItemId: "puzzle", variantId: null, volume: 5 },
      { menuItemId: "plowhorse", variantId: null, volume: 20 },
      { menuItemId: "dog", variantId: null, volume: 5 },
    ]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("joins actual margin and sales volume into all four standard quadrants", async () => {
    const rows = await analyticsService.getMenuEngineeringReport(auth, 30);
    expect(rows.map((row) => [row.menuItemId, row.quadrant])).toEqual([
      ["star", "STAR"],
      ["puzzle", "PUZZLE"],
      ["plowhorse", "PLOWHORSE"],
      ["dog", "DOG"],
    ]);
    expect(rows.every((row) => row.recommendation.length > 0)).toBe(true);
  });

  it("uses the requested configurable analysis window", async () => {
    await analyticsService.getMenuEngineeringReport(auth, 30);
    const since = salesVolumeByItem.mock.calls[0]![2] as Date;
    expect(since.toISOString()).toBe("2026-07-31T12:00:00.000Z");
  });
});
