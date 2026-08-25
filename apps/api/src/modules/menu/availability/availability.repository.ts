/**
 * Menu availability repository — data access only, for schedules,
 * holidays, and branch overrides. Business rules (schedule field
 * validation, effective-status precedence, override validation) live in
 * `availability.service.ts`.
 *
 * `findByIds` moved here from the legacy `menu/repository.ts` — it's the
 * order-time pricing read, and pricing/availability at order time is what
 * this sub-domain is about. `orders/order.service.ts` now imports it from
 * here instead.
 */
import { eq, and, or, isNull, inArray, gte, lte } from 'drizzle-orm';
import type { MenuItemStatus, MenuItemScheduleType } from '@pos/types';
import { db } from '../../../db';
import {
  menuItems,
  menuItemBranchOverrides,
  menuItemSchedules,
  holidays,
  branches,
} from '../../../db/schema';
import { compact } from '../../../lib/object-utils';

export const availabilityRepository = {
  // ─── Order-time pricing (moved from menu/repository.ts) ────────────────────

  async findByIds(tenantId: string, ids: string[], branchId?: string | undefined) {
    const items = await db.query.menuItems.findMany({
      where: and(
        eq(menuItems.tenantId, tenantId),
        inArray(menuItems.id, ids),
        isNull(menuItems.deletedAt),
        eq(menuItems.isPublished, true), // a draft item is never orderable, regardless of status
        branchId ? or(eq(menuItems.branchId, branchId), isNull(menuItems.branchId)) : undefined,
      ),
      with: {
        variants: true,
        modifierGroupLinks: { with: { group: { with: { options: true } } } },
      },
    });

    // Order pricing (resolveItems in orders/order-pricing.ts) reads
    // menuItem.basePrice and menuItem.taxRate directly — overlaying both
    // branch override fields here, rather than making every pricing
    // call-site check for overrides separately, is the one place that
    // needs to know about overrides. Variant prices are untouched: a
    // variant's price replaces basePrice outright, and branch overrides
    // don't extend to per-variant pricing in this phase.
    if (branchId) {
      const tenantWideIds = items.filter((i) => i.branchId === null).map((i) => i.id);
      if (tenantWideIds.length) {
        const overrides = await db.query.menuItemBranchOverrides.findMany({
          where: and(
            eq(menuItemBranchOverrides.branchId, branchId),
            inArray(menuItemBranchOverrides.menuItemId, tenantWideIds),
          ),
        });
        const priceByItemId = new Map(
          overrides.filter((o) => o.price != null).map((o) => [o.menuItemId, o.price as string]),
        );
        const taxByItemId = new Map(
          overrides.filter((o) => o.taxRate != null).map((o) => [o.menuItemId, o.taxRate as string]),
        );
        for (const item of items) {
          const overridePrice = priceByItemId.get(item.id);
          if (overridePrice != null) item.basePrice = overridePrice;
          const overrideTax = taxByItemId.get(item.id);
          if (overrideTax != null) item.taxRate = overrideTax;
        }
      }
    }

    return items;
  },

  // ─── Schedules ───────────────────────────────────────────────────────────

  async findItemBasics(tenantId: string, itemId: string) {
    return db.query.menuItems.findFirst({
      where: and(eq(menuItems.id, itemId), eq(menuItems.tenantId, tenantId)),
      columns: { id: true, status: true, branchId: true },
    });
  },

  async findFullItem(tenantId: string, itemId: string) {
    return db.query.menuItems.findFirst({
      where: and(eq(menuItems.id, itemId), eq(menuItems.tenantId, tenantId)),
    });
  },

  // Used by the (currently unwired) getItemsAvailableAt bulk helper.
  async listActiveItemBasics(tenantId: string) {
    return db.query.menuItems.findMany({
      where: and(eq(menuItems.tenantId, tenantId), isNull(menuItems.deletedAt)),
      columns: { id: true, status: true },
    });
  },

  async listSchedulesForItem(tenantId: string, itemId: string) {
    return db.query.menuItemSchedules.findMany({
      where: and(eq(menuItemSchedules.tenantId, tenantId), eq(menuItemSchedules.menuItemId, itemId)),
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });
  },

  async findActiveSchedulesForItem(tenantId: string, itemId: string, branchId?: string | undefined) {
    return db.query.menuItemSchedules.findMany({
      where: and(
        eq(menuItemSchedules.tenantId, tenantId),
        eq(menuItemSchedules.menuItemId, itemId),
        eq(menuItemSchedules.isActive, true),
        branchId ? or(isNull(menuItemSchedules.branchId), eq(menuItemSchedules.branchId, branchId)) : undefined,
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
        statusDuringPeriod: data.statusDuringPeriod ?? 'ACTIVE',
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
      .where(and(eq(menuItemSchedules.id, scheduleId), eq(menuItemSchedules.tenantId, tenantId)))
      .returning();
    return row;
  },

  async deleteSchedule(tenantId: string, scheduleId: string) {
    await db
      .delete(menuItemSchedules)
      .where(and(eq(menuItemSchedules.id, scheduleId), eq(menuItemSchedules.tenantId, tenantId)));
  },

  // ─── Holidays ────────────────────────────────────────────────────────────

  async listHolidays(tenantId: string, year?: number | undefined, region?: string | undefined) {
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
      where: and(eq(holidays.tenantId, tenantId), eq(holidays.name, name), eq(holidays.holidayDate, date)),
    });
  },

  async createHoliday(tenantId: string, data: { name: string; holidayDate: string; region?: string | undefined }) {
    const [row] = await db
      .insert(holidays)
      .values(compact({ tenantId, ...data }) as typeof holidays.$inferInsert)
      .returning();
    return row;
  },

  async updateHoliday(
    tenantId: string,
    holidayId: string,
    data: { name?: string | undefined; holidayDate?: string | undefined; region?: string | null | undefined },
  ) {
    const [row] = await db
      .update(holidays)
      .set(compact(data))
      .where(and(eq(holidays.id, holidayId), eq(holidays.tenantId, tenantId)))
      .returning();
    return row;
  },

  async deleteHoliday(tenantId: string, holidayId: string) {
    await db.delete(holidays).where(and(eq(holidays.id, holidayId), eq(holidays.tenantId, tenantId)));
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
        target: [menuItemBranchOverrides.menuItemId, menuItemBranchOverrides.branchId],
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
