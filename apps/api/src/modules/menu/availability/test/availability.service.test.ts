import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  findItemBasics,
  findFullItem,
  findActiveSchedulesForItem,
  getOverride,
  findHoliday,
  setManualOverride,
  clearManualOverride,
  getChannelOverride,
  findVariant,
  setComputedItemStatus,
  setComputedVariantStatus,
  findModifierOptionForItem,
  setComputedModifierAvailability,
  setManualStockCount,
  listDashboardItems,
} = vi.hoisted(() => ({
  findItemBasics: vi.fn(),
  findFullItem: vi.fn(),
  findActiveSchedulesForItem: vi.fn(),
  getOverride: vi.fn(),
  findHoliday: vi.fn(),
  setManualOverride: vi.fn(),
  clearManualOverride: vi.fn(),
  getChannelOverride: vi.fn(),
  findVariant: vi.fn(),
  setComputedItemStatus: vi.fn(),
  setComputedVariantStatus: vi.fn(),
  findModifierOptionForItem: vi.fn(),
  setComputedModifierAvailability: vi.fn(),
  setManualStockCount: vi.fn(),
  listDashboardItems: vi.fn(),
}));

vi.mock("../availability.repository", () => ({
  availabilityRepository: {
    findItemBasics,
    findFullItem,
    findActiveSchedulesForItem,
    getOverride,
    findHoliday,
    setManualOverride,
    clearManualOverride,
    getChannelOverride,
    findVariant,
    setComputedItemStatus,
    setComputedVariantStatus,
    findModifierOptionForItem,
    setComputedModifierAvailability,
    setManualStockCount,
    listDashboardItems,
  },
}));

const { writeAudit } = vi.hoisted(() => ({ writeAudit: vi.fn() }));
vi.mock("../../../../core/audit", () => ({ writeAudit }));
const { publish } = vi.hoisted(() => ({ publish: vi.fn() }));
vi.mock("../../../../lib/event-bus", () => ({ eventBus: { publish } }));

import { availabilityService } from "../availability.service";

function localDate(hour: number, minute: number, second: number) {
  return new Date(2026, 7, 29, hour, minute, second, 0);
}

const dailySchedule = {
  id: "schedule-1",
  tenantId: "tenant-1",
  menuItemId: "item-1",
  branchId: null,
  scheduleType: "DAILY" as const,
  startTime: "07:00:00",
  endTime: "11:00:00",
  dayOfWeek: null,
  startDate: null,
  endDate: null,
  holidayName: null,
  statusDuringPeriod: "ACTIVE" as const,
  isActive: true,
  createdAt: new Date(0),
  updatedAt: new Date(0),
};

beforeEach(() => {
  vi.clearAllMocks();
  findItemBasics.mockResolvedValue({
    id: "item-1",
    status: "OUT_OF_STOCK",
    branchId: null,
    availabilityReason: "Inventory unavailable",
    manualOverrideStatus: null,
    manualOverrideReason: null,
    manualOverrideSetBy: null,
    manualOverrideSetAt: null,
  });
  findFullItem.mockResolvedValue({
    id: "item-1",
    name: "Breakfast",
    branchId: null,
    status: "OUT_OF_STOCK",
    basePrice: "100.00",
    taxRate: "5.00",
    prepTimeMinutes: 10,
    availabilityReason: null,
    manualOverrideStatus: null,
    manualOverrideReason: null,
    manualOverrideSetBy: null,
    manualOverrideSetAt: null,
  });
  findActiveSchedulesForItem.mockResolvedValue([dailySchedule]);
  getOverride.mockResolvedValue(undefined);
  getChannelOverride.mockResolvedValue(undefined);
  findHoliday.mockResolvedValue(undefined);
  writeAudit.mockResolvedValue(undefined);
  publish.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("availabilityService deterministic asOf handling", () => {
  it.each([
    ["immediately before the window", localDate(6, 59, 59), "OUT_OF_STOCK"],
    ["exactly when the window begins", localDate(7, 0, 0), "ACTIVE"],
    ["during the window", localDate(9, 30, 0), "ACTIVE"],
    ["exactly when the window ends", localDate(11, 0, 0), "ACTIVE"],
    ["immediately after the window", localDate(11, 0, 1), "OUT_OF_STOCK"],
  ])("resolves %s from the supplied asOf", async (_label, asOf, expected) => {
    await expect(
      availabilityService.getEffectiveStatus(
        "tenant-1",
        "item-1",
        "branch-1",
        { channel: "STAFF", fulfillmentType: "DINE_IN", asOf },
      ),
    ).resolves.toMatchObject({ status: expected });
  });

  it("uses the same explicit asOf regardless of the actual system clock", async () => {
    const asOf = localDate(9, 30, 0);

    vi.useFakeTimers();
    vi.setSystemTime(localDate(1, 0, 0));
    const first = await availabilityService.getEffectiveStatus(
      "tenant-1",
      "item-1",
      "branch-1",
      { channel: "STAFF", fulfillmentType: "DINE_IN", asOf },
    );

    vi.setSystemTime(localDate(23, 0, 0));
    const second = await availabilityService.getEffectiveStatus(
      "tenant-1",
      "item-1",
      "branch-1",
      { channel: "STAFF", fulfillmentType: "DINE_IN", asOf },
    );

    expect(first).toEqual(second);
    expect(second.status).toBe("ACTIVE");
  });

  it("threads asOf through effective item resolution", async () => {
    const asOf = localDate(11, 0, 1);

    const result = await availabilityService.getEffectiveItem(
      "tenant-1",
      "item-1",
      "branch-1",
      { channel: "UNSCOPED", fulfillmentType: "UNSCOPED", asOf },
    );

    expect(result.effectiveStatus).toBe("OUT_OF_STOCK");
    expect(findActiveSchedulesForItem).toHaveBeenCalledWith(
      "tenant-1",
      "item-1",
      "branch-1",
    );
  });

  it("accepts explicit channel and fulfillment context without changing current resolution", async () => {
    const asOf = localDate(9, 30, 0);

    const staffDineIn = await availabilityService.getEffectiveItem(
      "tenant-1",
      "item-1",
      "branch-1",
      { channel: "STAFF", fulfillmentType: "DINE_IN", asOf },
    );
    const customerTakeaway = await availabilityService.getEffectiveItem(
      "tenant-1",
      "item-1",
      "branch-1",
      { channel: "CUSTOMER_QR", fulfillmentType: "TAKEAWAY", asOf },
    );

    expect(customerTakeaway).toEqual(staffDineIn);
  });

  it("applies a delivery-only channel override without affecting dine-in", async () => {
    findActiveSchedulesForItem.mockResolvedValue([]);
    findItemBasics.mockResolvedValue({ ...(await findItemBasics()), status: "ACTIVE" });
    getChannelOverride.mockImplementation(async (_tenant, _item, channel, fulfillment) =>
      channel === "CUSTOMER_QR" && fulfillment === "DELIVERY"
        ? { status: "OUT_OF_STOCK", isHidden: true, availabilityReason: "Delivery packaging unavailable" }
        : undefined);
    const dineIn = await availabilityService.getEffectiveItem("tenant-1", "item-1", "branch-1", { channel: "STAFF", fulfillmentType: "DINE_IN", asOf: localDate(9, 0, 0) });
    const delivery = await availabilityService.getEffectiveItem("tenant-1", "item-1", "branch-1", { channel: "CUSTOMER_QR", fulfillmentType: "DELIVERY", asOf: localDate(9, 0, 0) });
    expect(dineIn.effectiveStatus).toBe("ACTIVE");
    expect(delivery).toMatchObject({ effectiveStatus: "OUT_OF_STOCK", isHidden: true, availabilityReason: "Delivery packaging unavailable" });
  });
});

describe("availabilityService manual override precedence", () => {
  it("keeps a manual 86 in force while a schedule says ACTIVE", async () => {
    findItemBasics.mockResolvedValue({
      id: "item-1",
      status: "ACTIVE",
      branchId: null,
      availabilityReason: null,
      manualOverrideStatus: "OUT_OF_STOCK",
      manualOverrideReason: "Chef 86 - equipment issue",
      manualOverrideSetBy: "user-1",
      manualOverrideSetAt: new Date(),
    });

    const result = await availabilityService.getEffectiveStatus(
      "tenant-1",
      "item-1",
      "branch-1",
      {
        channel: "STAFF",
        fulfillmentType: "DINE_IN",
        asOf: localDate(9, 30, 0),
      },
    );

    expect(result).toEqual({
      status: "OUT_OF_STOCK",
      reason: "Chef 86 - equipment issue",
    });
  });

  it("manual override outranks a branch status override", async () => {
    findFullItem.mockResolvedValue({
      id: "item-1",
      name: "Breakfast",
      branchId: null,
      status: "ACTIVE",
      basePrice: "100.00",
      taxRate: "5.00",
      prepTimeMinutes: 10,
      availabilityReason: null,
      manualOverrideStatus: "OUT_OF_STOCK",
      manualOverrideReason: "Chef 86",
      manualOverrideSetBy: "user-1",
      manualOverrideSetAt: new Date(),
    });
    findItemBasics.mockResolvedValue({
      id: "item-1",
      status: "ACTIVE",
      branchId: null,
      availabilityReason: null,
      manualOverrideStatus: "OUT_OF_STOCK",
      manualOverrideReason: "Chef 86",
      manualOverrideSetBy: "user-1",
      manualOverrideSetAt: new Date(),
    });
    getOverride.mockResolvedValue({ status: "ACTIVE", availabilityReason: "Branch active" });

    const result = await availabilityService.getEffectiveItem(
      "tenant-1",
      "item-1",
      "branch-1",
      {
        channel: "STAFF",
        fulfillmentType: "DINE_IN",
        asOf: localDate(9, 30, 0),
      },
    );

    expect(result.effectiveStatus).toBe("OUT_OF_STOCK");
    expect(result.availabilityReason).toBe("Chef 86");
  });

  it("clearing the manual override returns control to computed availability", async () => {
    clearManualOverride.mockResolvedValue({
      id: "item-1",
      manualOverrideStatus: null,
    });

    await availabilityService.clearManualOverride("tenant-1", "item-1");
    expect(clearManualOverride).toHaveBeenCalledWith("tenant-1", "item-1");
  });

  it("requires a non-blank reason when setting a manual override", async () => {
    await expect(
      availabilityService.setManualOverride(
        "tenant-1",
        "item-1",
        { status: "OUT_OF_STOCK", reason: "   " },
        "user-1",
      ),
    ).rejects.toThrow("A reason is required for a manual availability override");
    expect(setManualOverride).not.toHaveBeenCalled();
  });
});

describe("availabilityService inventory-computed availability ownership", () => {
  it("persists item computed state and emits audit + realtime without clearing manual precedence", async () => {
    findItemBasics.mockResolvedValue({
      id: "item-1", status: "ACTIVE", branchId: "branch-1", availabilityReason: null,
      manualOverrideStatus: "HIDDEN", manualOverrideReason: "Manager hold",
      manualOverrideSetBy: "u1", manualOverrideSetAt: new Date(),
    });
    setComputedItemStatus.mockResolvedValue({ id: "item-1", status: "OUT_OF_STOCK" });

    await availabilityService.applyInventoryItemSignal(
      "tenant-1", "branch-1", "item-1", false,
    );

    expect(setComputedItemStatus).toHaveBeenCalledWith(
      "tenant-1", "item-1", "OUT_OF_STOCK", "Insufficient inventory",
    );
    expect(writeAudit).toHaveBeenCalledWith(expect.objectContaining({
      action: "MENU_AVAILABILITY_COMPUTED_CHANGED",
      entity: "menu_item",
      metadata: expect.objectContaining({ effectiveStatus: "HIDDEN" }),
    }));
    expect(publish).toHaveBeenCalledWith(
      expect.objectContaining({ type: "menu.availability.updated" }),
      "tenant-1", "branch-1",
    );
  });

  it("keeps a modifier manual hold effective while updating only its inventory signal", async () => {
    findModifierOptionForItem.mockResolvedValue({
      id: "opt-1", computedAvailability: false, manualOverrideAvailability: false, isAvailable: false,
    });
    setComputedModifierAvailability.mockResolvedValue({ id: "opt-1", isAvailable: false });

    await availabilityService.applyInventoryModifierSignal(
      "tenant-1", "branch-1", "item-1", "opt-1", true,
    );

    expect(setComputedModifierAvailability).toHaveBeenCalledWith("opt-1", true);
    expect(publish).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "menu.availability.updated",
        payload: expect.objectContaining({
          computedAvailability: true, effectiveAvailability: false,
        }),
      }),
      "tenant-1", "branch-1",
    );
  });

  it("updates variant computed state while preserving manual effective status", async () => {
    findVariant.mockResolvedValue({
      id: "v1", menuItemId: "item-1", status: "ACTIVE", manualOverrideStatus: "OUT_OF_STOCK",
      menuItem: { tenantId: "tenant-1", branchId: "branch-1" },
    });
    setComputedVariantStatus.mockResolvedValue({ id: "v1", status: "OUT_OF_STOCK" });

    await availabilityService.applyInventoryVariantSignal(
      "tenant-1", "branch-1", "v1", false,
    );

    expect(setComputedVariantStatus).toHaveBeenCalledWith("v1", "OUT_OF_STOCK");
    expect(writeAudit).toHaveBeenCalledWith(expect.objectContaining({
      entity: "menu_item_variant",
      metadata: expect.objectContaining({ effectiveStatus: "OUT_OF_STOCK" }),
    }));
  });
});

describe("G4 manual stock-count availability", () => {
  it("treats a depleted item count as OUT_OF_STOCK below a human override", async () => {
    findItemBasics.mockResolvedValue({
      id: "item-1", status: "ACTIVE", branchId: null, availabilityReason: null,
      manualStockCount: 0, manualOverrideStatus: null, manualOverrideReason: null,
    });
    await expect(availabilityService.getEffectiveStatus("tenant-1", "item-1", "branch-1", {
      channel: "STAFF", fulfillmentType: "DINE_IN", asOf: localDate(9, 0, 0),
    })).resolves.toEqual({ status: "OUT_OF_STOCK", reason: "Manual stock count depleted" });

    findItemBasics.mockResolvedValue({
      id: "item-1", status: "ACTIVE", branchId: null, availabilityReason: null,
      manualStockCount: 0, manualOverrideStatus: "ACTIVE", manualOverrideReason: "Manager override",
    });
    await expect(availabilityService.getEffectiveStatus("tenant-1", "item-1", "branch-1", {
      channel: "STAFF", fulfillmentType: "DINE_IN", asOf: localDate(9, 0, 0),
    })).resolves.toEqual({ status: "ACTIVE", reason: "Manager override" });
  });

  it("applies the same count precedence to variants", async () => {
    findVariant.mockResolvedValue({
      id: "variant-1", status: "ACTIVE", manualStockCount: 0, manualOverrideStatus: null,
      manualOverrideReason: null, menuItem: { tenantId: "tenant-1" },
    });
    await expect(availabilityService.getEffectiveVariant("tenant-1", "variant-1"))
      .resolves.toMatchObject({ effectiveStatus: "OUT_OF_STOCK", availabilityReason: "Manual stock count depleted" });

    findVariant.mockResolvedValue({
      id: "variant-1", status: "ACTIVE", manualStockCount: 0, manualOverrideStatus: "ACTIVE",
      manualOverrideReason: "Manager override", menuItem: { tenantId: "tenant-1" },
    });
    await expect(availabilityService.getEffectiveVariant("tenant-1", "variant-1"))
      .resolves.toMatchObject({ effectiveStatus: "ACTIVE", availabilityReason: "Manager override" });
  });

  it("publishes the manager stock reset through the existing realtime availability event", async () => {
    setManualStockCount.mockResolvedValue({ entityType: "MENU_ITEM", id: "item-1", manualStockCount: 6 });
    await availabilityService.setManualStockCount("tenant-1", "branch-1", "item-1", 6);
    expect(setManualStockCount).toHaveBeenCalledWith("tenant-1", "item-1", 6, undefined);
    expect(publish).toHaveBeenCalledWith({
      type: "menu.availability.updated",
      payload: expect.objectContaining({ source: "MANUAL_STOCK_COUNT", menuItemId: "item-1", manualStockCount: 6 }),
    }, "tenant-1", "branch-1");
  });

  it("does not let ACTIVE branch/channel overrides resurrect a depleted count", async () => {
    findItemBasics.mockResolvedValue({
      id: "item-1", status: "ACTIVE", branchId: null, availabilityReason: null,
      manualStockCount: 0, manualOverrideStatus: null, manualOverrideReason: null,
    });
    findFullItem.mockResolvedValue({
      id: "item-1", name: "Croissant", branchId: null, status: "ACTIVE",
      basePrice: "80.00", taxRate: "5.00", prepTimeMinutes: 2,
      availabilityReason: null, manualStockCount: 0,
      manualOverrideStatus: null, manualOverrideReason: null,
    });
    getOverride.mockResolvedValue({
      status: "ACTIVE", price: null, taxRate: null, prepTimeMinutes: null,
      isHidden: false, availabilityReason: "Branch wants it active",
    });
    getChannelOverride.mockResolvedValue({
      status: "ACTIVE", isHidden: false, availabilityReason: "Delivery wants it active",
    });

    const result = await availabilityService.getEffectiveItem(
      "tenant-1", "item-1", "branch-1",
      { channel: "STAFF", fulfillmentType: "DINE_IN", asOf: localDate(9, 0, 0) },
    );

    expect(result.effectiveStatus).toBe("OUT_OF_STOCK");
    expect(result.availabilityCause).toBe("MANUAL_COUNT");
    expect(result.availabilityReason).toBe("Manual stock count depleted");
  });
});

describe("H1 deterministic AvailabilityResolver replay", () => {
  it("replays the exact precedence resolver from fire-time evidence without reading current menu state", async () => {
    const at = localDate(9, 0, 0);
    const live = await availabilityService.getEffectiveItemWithEvidence(
      "tenant-1",
      "item-1",
      "branch-1",
      { channel: "STAFF", fulfillmentType: "DINE_IN", asOf: at },
    );

    expect(live.effective.effectiveStatus).toBe("ACTIVE");
    expect(live.effective.availabilityCause).toBe("SCHEDULE");

    findItemBasics.mockClear();
    findFullItem.mockClear();
    findActiveSchedulesForItem.mockClear();
    getOverride.mockClear();
    getChannelOverride.mockClear();
    findFullItem.mockRejectedValue(new Error("current menu must not be read during replay"));

    const replayed = await availabilityService.getEffectiveItem(
      "tenant-1",
      "item-1",
      "branch-1",
      {
        channel: "STAFF",
        fulfillmentType: "DINE_IN",
        asOf: at,
        historicalReplay: live.evidence,
      },
    );

    expect(replayed).toMatchObject({
      effectiveStatus: live.effective.effectiveStatus,
      availabilityReason: live.effective.availabilityReason,
      availabilityCause: live.effective.availabilityCause,
      isHidden: live.effective.isHidden,
    });
    expect(findItemBasics).not.toHaveBeenCalled();
    expect(findFullItem).not.toHaveBeenCalled();
    expect(findActiveSchedulesForItem).not.toHaveBeenCalled();
    expect(getOverride).not.toHaveBeenCalled();
    expect(getChannelOverride).not.toHaveBeenCalled();
  });
});
