import { beforeEach, describe, expect, it, vi } from "vitest";

const { listDashboardItems, loadDashboardResolutionData } = vi.hoisted(() => ({
  listDashboardItems: vi.fn(),
  loadDashboardResolutionData: vi.fn(),
}));
vi.mock("../availability.repository", () => ({
  availabilityRepository: { listDashboardItems, loadDashboardResolutionData },
}));
vi.mock("../../../../core/audit", () => ({ writeAudit: vi.fn() }));
vi.mock("../../../../lib/event-bus", () => ({ eventBus: { publish: vi.fn() } }));

import { availabilityService } from "../availability.service";

const baseItem = {
  id: "item-1",
  name: "Pizza",
  branchId: null,
  status: "ACTIVE",
  basePrice: "10.00",
  taxRate: "5.00",
  prepTimeMinutes: 10,
  availabilityReason: null,
  manualOverrideStatus: null,
  manualOverrideReason: null,
  manualStockCount: null,
  variants: [
    {
      id: "variant-1",
      name: "Large",
      status: "ACTIVE",
      manualOverrideStatus: null,
      manualOverrideReason: null,
      manualStockCount: 0,
    },
  ],
  modifierGroupLinks: [
    {
      group: {
        name: "Sauce",
        options: [
          {
            id: "modifier-1",
            name: "Pesto",
            manualOverrideAvailability: null,
            computedAvailability: false,
          },
        ],
      },
    },
  ],
};

describe("cross-channel availability dashboard", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    listDashboardItems.mockReset();
    loadDashboardResolutionData.mockReset();
    listDashboardItems.mockResolvedValue([baseItem]);
    loadDashboardResolutionData.mockResolvedValue({
      schedules: [],
      branchOverrides: [
        {
          menuItemId: "item-1",
          branchId: "branch-b",
          status: "OUT_OF_STOCK",
          price: null,
          taxRate: null,
          prepTimeMinutes: null,
          isHidden: false,
          availabilityReason: "Insufficient inventory",
        },
      ],
      channelOverrides: [],
      holidays: [],
    });
  });

  it("loads resolution data once and evaluates every requested context in memory", async () => {
    const result = await availabilityService.getUnavailableDashboard(
      "tenant",
      ["branch-a", "branch-b"],
      {},
      new Date("2026-08-30T12:00:00.000Z"),
    );

    expect(listDashboardItems).toHaveBeenCalledTimes(1);
    expect(loadDashboardResolutionData).toHaveBeenCalledTimes(1);
    expect(result.channels).toEqual(["STAFF", "CUSTOMER_QR"]);
    expect(result.fulfillmentTypes).toEqual([
      "DINE_IN",
      "TAKEAWAY",
      "DELIVERY",
      "ONLINE",
    ]);
    expect(result.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          entityType: "ITEM",
          entityId: "item-1",
          branchId: "branch-b",
          channel: "CUSTOMER_QR",
          fulfillmentType: "DELIVERY",
          cause: "BRANCH_OVERRIDE",
        }),
        expect.objectContaining({
          entityType: "VARIANT",
          entityId: "variant-1",
          cause: "MANUAL_COUNT",
        }),
        expect.objectContaining({
          entityType: "MODIFIER_OPTION",
          entityId: "modifier-1",
          cause: "RECIPE_DRIVEN",
        }),
      ]),
    );
  });

  it("applies cause filtering to structured schedule causes", async () => {
    loadDashboardResolutionData.mockResolvedValue({
      schedules: [
        {
          menuItemId: "item-1",
          branchId: null,
          scheduleType: "DAILY",
          startTime: "00:00:00",
          endTime: "23:59:59",
          dayOfWeek: null,
          startDate: null,
          endDate: null,
          holidayName: null,
          isActive: true,
          statusDuringPeriod: "OUT_OF_STOCK",
        },
      ],
      branchOverrides: [],
      channelOverrides: [],
      holidays: [],
    });

    const result = await availabilityService.getUnavailableDashboard(
      "tenant",
      ["branch-a"],
      { channel: "STAFF", fulfillmentType: "DINE_IN", cause: "SCHEDULE" },
      new Date("2026-08-30T12:00:00.000Z"),
    );
    expect(result.rows).toEqual([
      expect.objectContaining({ entityType: "ITEM", cause: "SCHEDULE" }),
    ]);
  });
});
