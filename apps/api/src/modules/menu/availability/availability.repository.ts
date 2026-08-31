/**
 * Menu availability repository — data access only, for schedules,
 * holidays, and branch overrides. Business rules (schedule field
 * validation, effective-status precedence, override validation) live in
 * `availability.service.ts`.
 *
 * `findByIds` lives here with the availability data-access boundary. It is the
 * order-time pricing read, and pricing/availability at order time is what
 * this sub-domain is about. `orders/order.service.ts` now imports it from
 * here instead.
 */
import { eq, and, or, isNull, inArray, gte, lte } from "drizzle-orm";
import type { MenuItemStatus, MenuItemScheduleType } from "@pos/types";
import { db } from "../../../db";
import {
  menuItems,
  menuItemVariants,
  menuItemBranchOverrides,
  menuItemChannelOverrides,
  menuItemSchedules,
  holidays,
  branches,
  modifierOptions,
  menuItemModifierGroups,
} from "../../../db/schema";
import { compact } from "../../../lib/object-utils";
import {
  withEffectiveMenuItemAvailability,
  withEffectiveModifierAvailability,
} from "./availability-view";

export const availabilityRepository = {
  async listDashboardItems(tenantId: string) {
    return db.query.menuItems.findMany({
      where: and(
        eq(menuItems.tenantId, tenantId),
        isNull(menuItems.deletedAt),
        eq(menuItems.isPublished, true),
      ),
      columns: {
        id: true,
        name: true,
        branchId: true,
        status: true,
        basePrice: true,
        taxRate: true,
        prepTimeMinutes: true,
        availabilityReason: true,
        manualOverrideStatus: true,
        manualOverrideReason: true,
        manualStockCount: true,
      },
      with: {
        variants: true,
        modifierGroupLinks: {
          with: { group: { with: { options: true } } },
        },
      },
      orderBy: (item, { asc }) => [asc(item.name)],
    });
  },

  async loadDashboardResolutionData(
    tenantId: string,
    itemIds: string[],
    branchIds: string[],
    holidayDate: string,
  ) {
    if (itemIds.length === 0) {
      return {
        schedules: [],
        branchOverrides: [],
        channelOverrides: [],
        holidays: [],
      };
    }

    const [schedules, branchOverrides, channelOverrides, holidayRows] =
      await Promise.all([
        db.query.menuItemSchedules.findMany({
          where: and(
            eq(menuItemSchedules.tenantId, tenantId),
            inArray(menuItemSchedules.menuItemId, itemIds),
            eq(menuItemSchedules.isActive, true),
            branchIds.length > 0
              ? or(
                  isNull(menuItemSchedules.branchId),
                  inArray(menuItemSchedules.branchId, branchIds),
                )
              : isNull(menuItemSchedules.branchId),
          ),
        }),
        branchIds.length > 0
          ? db.query.menuItemBranchOverrides.findMany({
              where: and(
                eq(menuItemBranchOverrides.tenantId, tenantId),
                inArray(menuItemBranchOverrides.menuItemId, itemIds),
                inArray(menuItemBranchOverrides.branchId, branchIds),
              ),
            })
          : Promise.resolve([]),
        db.query.menuItemChannelOverrides.findMany({
          where: and(
            eq(menuItemChannelOverrides.tenantId, tenantId),
            inArray(menuItemChannelOverrides.menuItemId, itemIds),
          ),
        }),
        db.query.holidays.findMany({
          where: and(
            eq(holidays.tenantId, tenantId),
            eq(holidays.holidayDate, holidayDate),
          ),
        }),
      ]);

    return { schedules, branchOverrides, channelOverrides, holidays: holidayRows };
  },
  async setManualStockCount(
    tenantId: string,
    itemId: string,
    count: number | null,
    variantId?: string | null,
  ) {
    if (variantId) {
      const variant = await db.query.menuItemVariants.findFirst({
        where: eq(menuItemVariants.id, variantId),
        with: { menuItem: true },
      });
      if (
        !variant ||
        variant.menuItemId !== itemId ||
        variant.menuItem.tenantId !== tenantId
      )
        return null;
      const [row] = await db
        .update(menuItemVariants)
        .set({ manualStockCount: count, manualStockCountUpdatedAt: new Date() })
        .where(eq(menuItemVariants.id, variantId))
        .returning();
      return { ...row!, menuItemId: itemId, entityType: "VARIANT" as const };
    }
    const [row] = await db
      .update(menuItems)
      .set({
        manualStockCount: count,
        manualStockCountUpdatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(menuItems.id, itemId), eq(menuItems.tenantId, tenantId)))
      .returning();
    return row
      ? { ...row, menuItemId: itemId, entityType: "ITEM" as const }
      : null;
  },

  async findVariant(variantId: string) {
    return db.query.menuItemVariants.findFirst({
      where: eq(menuItemVariants.id, variantId),
      with: { menuItem: true },
    });
  },
  async setVariantOverride(
    variantId: string,
    status: MenuItemStatus | null,
    reason: string | null,
  ) {
    const [row] = await db
      .update(menuItemVariants)
      .set({ manualOverrideStatus: status, manualOverrideReason: reason })
      .where(eq(menuItemVariants.id, variantId))
      .returning();
    return row;
  },

  async setComputedItemStatus(
    tenantId: string,
    itemId: string,
    status: "ACTIVE" | "OUT_OF_STOCK",
    reason: string | null,
  ) {
    const [row] = await db
      .update(menuItems)
      .set({
        status,
        availabilityReason: reason,
        statusChangedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(menuItems.id, itemId), eq(menuItems.tenantId, tenantId)))
      .returning();
    return row;
  },

  async setComputedVariantStatus(
    variantId: string,
    status: "ACTIVE" | "OUT_OF_STOCK",
  ) {
    const [row] = await db
      .update(menuItemVariants)
      .set({ status })
      .where(eq(menuItemVariants.id, variantId))
      .returning();
    return row;
  },

  async findModifierOptionForItem(
    tenantId: string,
    menuItemId: string,
    optionId: string,
  ) {
    const [row] = await db
      .select({
        id: modifierOptions.id,
        computedAvailability: modifierOptions.computedAvailability,
        manualOverrideAvailability: modifierOptions.manualOverrideAvailability,
      })
      .from(modifierOptions)
      .innerJoin(
        menuItemModifierGroups,
        eq(
          menuItemModifierGroups.modifierGroupId,
          modifierOptions.modifierGroupId,
        ),
      )
      .innerJoin(menuItems, eq(menuItems.id, menuItemModifierGroups.menuItemId))
      .where(
        and(
          eq(menuItems.tenantId, tenantId),
          eq(menuItems.id, menuItemId),
          eq(modifierOptions.id, optionId),
        ),
      )
      .limit(1);
    return row ? withEffectiveModifierAvailability(row) : null;
  },

  async setComputedModifierAvailability(
    optionId: string,
    computedAvailability: boolean,
  ) {
    const [row] = await db
      .update(modifierOptions)
      .set({ computedAvailability })
      .where(eq(modifierOptions.id, optionId))
      .returning();
    return row ? withEffectiveModifierAvailability(row) : undefined;
  },
  // ─── Order-time pricing (moved from menu/repository.ts) ────────────────────

  async findByIds(
    tenantId: string,
    ids: string[],
    branchId: string | undefined,
    asOf: Date,
  ) {
    const items = await db.query.menuItems.findMany({
      where: and(
        eq(menuItems.tenantId, tenantId),
        inArray(menuItems.id, ids),
        isNull(menuItems.deletedAt),
        eq(menuItems.isPublished, true), // a draft item is never orderable, regardless of status
        or(isNull(menuItems.effectiveFrom), lte(menuItems.effectiveFrom, asOf)),
        branchId
          ? or(eq(menuItems.branchId, branchId), isNull(menuItems.branchId))
          : undefined,
      ),
      with: {
        variants: true,
        modifierGroupLinks: {
          with: {
            group: { with: { options: { with: { variantPrices: true } } } },
          },
        },
      },
    });

    // Pricing is intentionally not overlaid here. A4 moves authoritative
    // branch price/tax resolution into PricingPipeline so availability data
    // stays unmutated and every order price passes through one staged path.

    return items.map((item) => ({
      ...withEffectiveMenuItemAvailability(item),
      modifierGroupLinks: item.modifierGroupLinks.map((link) => ({
        ...link,
        group: {
          ...link.group,
          options: link.group.options.map(withEffectiveModifierAvailability),
        },
      })),
    }));
  },

  async findPricingOverrides(
    tenantId: string,
    menuItemIds: string[],
    branchId: string,
  ) {
    if (menuItemIds.length === 0) return [];
    return db.query.menuItemBranchOverrides.findMany({
      where: and(
        eq(menuItemBranchOverrides.tenantId, tenantId),
        eq(menuItemBranchOverrides.branchId, branchId),
        inArray(menuItemBranchOverrides.menuItemId, menuItemIds),
      ),
    });
  },
  async listChannelOverrides(tenantId: string, itemId: string) {
    return db.query.menuItemChannelOverrides.findMany({
      where: and(
        eq(menuItemChannelOverrides.tenantId, tenantId),
        eq(menuItemChannelOverrides.menuItemId, itemId),
      ),
    });
  },
  async getChannelOverride(
    tenantId: string,
    itemId: string,
    channel: string,
    fulfillmentType: string,
  ) {
    const rows = await db.query.menuItemChannelOverrides.findMany({
      where: and(
        eq(menuItemChannelOverrides.tenantId, tenantId),
        eq(menuItemChannelOverrides.menuItemId, itemId),
        eq(menuItemChannelOverrides.channel, channel),
        or(
          eq(menuItemChannelOverrides.fulfillmentType, fulfillmentType),
          isNull(menuItemChannelOverrides.fulfillmentType),
        ),
      ),
    });
    return (
      rows.find((row) => row.fulfillmentType === fulfillmentType) ??
      rows.find((row) => row.fulfillmentType === null)
    );
  },
  async upsertChannelOverride(
    tenantId: string,
    itemId: string,
    channel: string,
    fulfillmentType: string | null,
    data: {
      status?: MenuItemStatus | null;
      isHidden?: boolean;
      availabilityReason?: string | null;
    },
  ) {
    const existing = (
      await availabilityRepository.listChannelOverrides(tenantId, itemId)
    ).find(
      (row) =>
        row.channel === channel && row.fulfillmentType === fulfillmentType,
    );
    if (existing) {
      const [updated] = await db
        .update(menuItemChannelOverrides)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(menuItemChannelOverrides.id, existing.id))
        .returning();
      return updated!;
    }
    const [created] = await db
      .insert(menuItemChannelOverrides)
      .values({
        tenantId,
        menuItemId: itemId,
        channel,
        fulfillmentType,
        ...data,
      })
      .returning();
    return created!;
  },
  async deleteChannelOverride(tenantId: string, id: string) {
    await db
      .delete(menuItemChannelOverrides)
      .where(
        and(
          eq(menuItemChannelOverrides.tenantId, tenantId),
          eq(menuItemChannelOverrides.id, id),
        ),
      );
  },

  // ─── Schedules ───────────────────────────────────────────────────────────

  async findItemBasics(tenantId: string, itemId: string) {
    return db.query.menuItems.findFirst({
      where: and(eq(menuItems.id, itemId), eq(menuItems.tenantId, tenantId)),
      columns: {
        id: true,
        status: true,
        branchId: true,
        availabilityReason: true,
        manualOverrideStatus: true,
        manualOverrideReason: true,
        manualOverrideSetBy: true,
        manualOverrideSetAt: true,
        manualStockCount: true,
        manualStockCountUpdatedAt: true,
      },
    });
  },

  async findFullItem(tenantId: string, itemId: string) {
    return db.query.menuItems.findFirst({
      where: and(eq(menuItems.id, itemId), eq(menuItems.tenantId, tenantId)),
    });
  },


  async listSchedulesForItem(tenantId: string, itemId: string) {
    return db.query.menuItemSchedules.findMany({
      where: and(
        eq(menuItemSchedules.tenantId, tenantId),
        eq(menuItemSchedules.menuItemId, itemId),
      ),
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });
  },

  async findActiveSchedulesForItem(
    tenantId: string,
    itemId: string,
    branchId?: string | undefined,
  ) {
    return db.query.menuItemSchedules.findMany({
      where: and(
        eq(menuItemSchedules.tenantId, tenantId),
        eq(menuItemSchedules.menuItemId, itemId),
        eq(menuItemSchedules.isActive, true),
        branchId
          ? or(
              isNull(menuItemSchedules.branchId),
              eq(menuItemSchedules.branchId, branchId),
            )
          : undefined,
      ),
    });
  },

  async createSchedule(data: {
    tenantId: string;
    menuItemId: string;
    branchId?: string | undefined;
    scheduleType: MenuItemScheduleType;
    startTime?: string | undefined;
    endTime?: string | undefined;
    dayOfWeek?: number | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    holidayName?: string | undefined;
    statusDuringPeriod?: MenuItemStatus | undefined;
  }) {
    const [row] = await db
      .insert(menuItemSchedules)
      .values({
        tenantId: data.tenantId,
        menuItemId: data.menuItemId,
        branchId: data.branchId ?? null,
        scheduleType: data.scheduleType,
        startTime: data.startTime ?? null,
        endTime: data.endTime ?? null,
        dayOfWeek: data.dayOfWeek ?? null,
        startDate: data.startDate ?? null,
        endDate: data.endDate ?? data.startDate ?? null,
        holidayName: data.holidayName ?? null,
        statusDuringPeriod: data.statusDuringPeriod ?? "ACTIVE",
      })
      .returning();
    return row!;
  },

  async updateSchedule(
    tenantId: string,
    scheduleId: string,
    data: {
      startTime?: string | undefined;
      endTime?: string | undefined;
      dayOfWeek?: number | undefined;
      startDate?: string | undefined;
      endDate?: string | undefined;
      holidayName?: string | undefined;
      statusDuringPeriod?: MenuItemStatus | undefined;
      branchId?: string | null | undefined;
      isActive?: boolean | undefined;
    },
  ) {
    const [row] = await db
      .update(menuItemSchedules)
      .set(compact({ ...data, updatedAt: new Date() }))
      .where(
        and(
          eq(menuItemSchedules.id, scheduleId),
          eq(menuItemSchedules.tenantId, tenantId),
        ),
      )
      .returning();
    return row;
  },

  async deleteSchedule(tenantId: string, scheduleId: string) {
    await db
      .delete(menuItemSchedules)
      .where(
        and(
          eq(menuItemSchedules.id, scheduleId),
          eq(menuItemSchedules.tenantId, tenantId),
        ),
      );
  },

  // ─── Holidays ────────────────────────────────────────────────────────────

  async listHolidays(
    tenantId: string,
    year?: number | undefined,
    region?: string | undefined,
  ) {
    return db.query.holidays.findMany({
      where: and(
        eq(holidays.tenantId, tenantId),
        region ? eq(holidays.region, region) : undefined,
        year ? gte(holidays.holidayDate, `${year}-01-01`) : undefined,
        year ? lte(holidays.holidayDate, `${year}-12-31`) : undefined,
      ),
      orderBy: (t, { asc }) => [asc(t.holidayDate)],
    });
  },

  async findHoliday(tenantId: string, name: string, date: string) {
    return db.query.holidays.findFirst({
      where: and(
        eq(holidays.tenantId, tenantId),
        eq(holidays.name, name),
        eq(holidays.holidayDate, date),
      ),
    });
  },

  async createHoliday(
    tenantId: string,
    data: { name: string; holidayDate: string; region?: string | undefined },
  ) {
    const [row] = await db
      .insert(holidays)
      .values(compact({ tenantId, ...data }) as typeof holidays.$inferInsert)
      .returning();
    return row;
  },

  async updateHoliday(
    tenantId: string,
    holidayId: string,
    data: {
      name?: string | undefined;
      holidayDate?: string | undefined;
      region?: string | null | undefined;
    },
  ) {
    const [row] = await db
      .update(holidays)
      .set(compact(data))
      .where(and(eq(holidays.id, holidayId), eq(holidays.tenantId, tenantId)))
      .returning();
    return row;
  },

  async deleteHoliday(tenantId: string, holidayId: string) {
    await db
      .delete(holidays)
      .where(and(eq(holidays.id, holidayId), eq(holidays.tenantId, tenantId)));
  },

  async setManualOverride(
    tenantId: string,
    itemId: string,
    status: MenuItemStatus,
    reason: string,
    userId: string,
  ) {
    const [row] = await db
      .update(menuItems)
      .set({
        manualOverrideStatus: status,
        manualOverrideReason: reason,
        manualOverrideSetBy: userId,
        manualOverrideSetAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(menuItems.id, itemId),
          eq(menuItems.tenantId, tenantId),
          isNull(menuItems.deletedAt),
        ),
      )
      .returning();
    return row;
  },

  async clearManualOverride(tenantId: string, itemId: string) {
    const [row] = await db
      .update(menuItems)
      .set({
        manualOverrideStatus: null,
        manualOverrideReason: null,
        manualOverrideSetBy: null,
        manualOverrideSetAt: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(menuItems.id, itemId),
          eq(menuItems.tenantId, tenantId),
          isNull(menuItems.deletedAt),
        ),
      )
      .returning();
    return row;
  },

  // ─── Branch overrides ────────────────────────────────────────────────────

  async getOverride(tenantId: string, menuItemId: string, branchId: string) {
    return db.query.menuItemBranchOverrides.findFirst({
      where: and(
        eq(menuItemBranchOverrides.tenantId, tenantId),
        eq(menuItemBranchOverrides.menuItemId, menuItemId),
        eq(menuItemBranchOverrides.branchId, branchId),
      ),
    });
  },

  async listOverridesForItem(tenantId: string, menuItemId: string) {
    return db.query.menuItemBranchOverrides.findMany({
      where: and(
        eq(menuItemBranchOverrides.tenantId, tenantId),
        eq(menuItemBranchOverrides.menuItemId, menuItemId),
      ),
      with: { branch: true },
    });
  },

  async findBranch(tenantId: string, branchId: string) {
    return db.query.branches.findFirst({
      where: and(eq(branches.id, branchId), eq(branches.tenantId, tenantId)),
      columns: { id: true },
    });
  },

  async upsertOverride(
    tenantId: string,
    menuItemId: string,
    branchId: string,
    values: {
      price: string | null;
      taxRate: string | null;
      prepTimeMinutes: number | null;
      status: MenuItemStatus | null;
      isHidden: boolean;
      availabilityReason: string | null;
    },
  ) {
    const [row] = await db
      .insert(menuItemBranchOverrides)
      .values({ tenantId, menuItemId, branchId, ...values })
      .onConflictDoUpdate({
        target: [
          menuItemBranchOverrides.menuItemId,
          menuItemBranchOverrides.branchId,
        ],
        set: { ...values, updatedAt: new Date() },
      })
      .returning();
    return row;
  },

  async deleteOverride(tenantId: string, menuItemId: string, branchId: string) {
    await db
      .delete(menuItemBranchOverrides)
      .where(
        and(
          eq(menuItemBranchOverrides.tenantId, tenantId),
          eq(menuItemBranchOverrides.menuItemId, menuItemId),
          eq(menuItemBranchOverrides.branchId, branchId),
        ),
      );
  },
};
