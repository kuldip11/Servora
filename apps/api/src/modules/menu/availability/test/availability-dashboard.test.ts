import { beforeEach, describe, expect, it, vi } from "vitest";

const { listDashboardItems } = vi.hoisted(() => ({ listDashboardItems: vi.fn() }));
vi.mock("../availability.repository", () => ({
  availabilityRepository: { listDashboardItems },
}));
vi.mock("../../../../core/audit", () => ({ writeAudit: vi.fn() }));
vi.mock("../../../../lib/event-bus", () => ({ eventBus: { publish: vi.fn() } }));

import { availabilityService } from "../availability.service";

describe("H2 cross-channel availability dashboard", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    listDashboardItems.mockReset();
    listDashboardItems.mockResolvedValue([
      {
        id: "item-1",
        name: "Pizza",
        branchId: null,
        variants: [
          { id: "variant-1", name: "Large" },
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
      },
    ]);
  });

  it("evaluates every requested branch/channel/fulfillment context and includes item, variant and modifier causes", async () => {
    const itemSpy = vi.spyOn(availabilityService, "getEffectiveItem").mockImplementation(
      async (_tenant, _item, branchId, context) => ({
        effectiveStatus:
          branchId === "branch-b" &&
          context.channel === "CUSTOMER_QR" &&
          context.fulfillmentType === "DELIVERY"
            ? "OUT_OF_STOCK"
            : "ACTIVE",
        isHidden: false,
        availabilityReason: "Insufficient inventory",
        availabilityCause: "RECIPE_DRIVEN",
      }) as never,
    );
    vi.spyOn(availabilityService, "getEffectiveVariant").mockResolvedValue({
      effectiveStatus: "OUT_OF_STOCK",
      availabilityReason: "Manual stock count depleted",
      manualOverrideStatus: null,
      manualStockCount: 0,
    } as never);

    const result = await availabilityService.getUnavailableDashboard(
      "tenant",
      ["branch-a", "branch-b"],
      {},
      new Date("2026-08-30T12:00:00.000Z"),
    );

    expect(itemSpy).toHaveBeenCalledTimes(16);
    expect(result.channels).toEqual(["STAFF", "CUSTOMER_QR"]);
    expect(result.fulfillmentTypes).toEqual(["DINE_IN", "TAKEAWAY", "DELIVERY", "ONLINE"]);
    expect(result.rows).toEqual(expect.arrayContaining([
      expect.objectContaining({
        entityType: "ITEM",
        entityId: "item-1",
        branchId: "branch-b",
        channel: "CUSTOMER_QR",
        fulfillmentType: "DELIVERY",
        cause: "RECIPE_DRIVEN",
      }),
      expect.objectContaining({ entityType: "VARIANT", entityId: "variant-1", cause: "MANUAL_COUNT" }),
      expect.objectContaining({ entityType: "MODIFIER_OPTION", entityId: "modifier-1", cause: "RECIPE_DRIVEN" }),
    ]));
  });

  it("applies cause filtering to structured resolver causes rather than reason substrings", async () => {
    vi.spyOn(availabilityService, "getEffectiveItem").mockResolvedValue({
      effectiveStatus: "OUT_OF_STOCK",
      isHidden: false,
      availabilityReason: "Words that do not contain the cause name",
      availabilityCause: "SCHEDULE",
    } as never);
    vi.spyOn(availabilityService, "getEffectiveVariant").mockResolvedValue({
      effectiveStatus: "ACTIVE",
      manualOverrideStatus: null,
      manualStockCount: null,
    } as never);

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
