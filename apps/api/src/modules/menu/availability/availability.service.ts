/**
 * Menu availability service — schedule field validation, effective-status
 * computation (schedule precedence + branch override layering), and
 * branch-override validation. Extracted from `schedule.service.ts` (kept
 * pure business logic here) and `menu/repository.ts#getEffectiveItem`
 * (moved here since it's a decision — override > schedule > base status —
 * not just a data read).
 */
import type { MenuItemStatus, MenuItemScheduleType } from "@pos/types";
import { availabilityRepository } from "./availability.repository";
import {
  itemNotFound,
  scheduleNotFound,
  branchNotFoundForOverride,
  itemNotTenantWide,
  invalidScheduleFields,
} from "./availability.errors";

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function formatTime(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
function formatDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
// 'HH:MM:SS' string comparison works lexicographically for same-day ranges;
// overnight ranges (e.g. 22:00 -> 02:00) need the OR-wrap below.
function timeInRange(now: string, start: string, end: string): boolean {
  if (start <= end) return now >= start && now <= end;
  return now >= start || now <= end; // wraps past midnight
}

const SCHEDULE_TYPE_PRIORITY: Record<MenuItemScheduleType, number> = {
  HOLIDAY: 3,
  SPECIFIC_DATE: 2,
  WEEKLY: 1,
  DAILY: 0,
};

type ScheduleRow = Awaited<
  ReturnType<typeof availabilityRepository.findActiveSchedulesForItem>
>[number];

export interface CreateScheduleInput {
  scheduleType: MenuItemScheduleType;
  startTime?: string | undefined;
  endTime?: string | undefined;
  dayOfWeek?: number | undefined;
  startDate?: string | undefined;
  endDate?: string | undefined;
  holidayName?: string | undefined;
  statusDuringPeriod?: MenuItemStatus | undefined;
  branchId?: string | undefined;
}

export interface UpdateScheduleInput {
  startTime?: string | undefined;
  endTime?: string | undefined;
  dayOfWeek?: number | undefined;
  startDate?: string | undefined;
  endDate?: string | undefined;
  holidayName?: string | undefined;
  statusDuringPeriod?: MenuItemStatus | undefined;
  branchId?: string | null | undefined;
  isActive?: boolean | undefined;
}

export interface UpsertOverrideInput {
  price?: number | null | undefined;
  taxRate?: number | null | undefined;
  prepTimeMinutes?: number | null | undefined;
  status?: MenuItemStatus | null | undefined;
  isHidden?: boolean | undefined;
  availabilityReason?: string | null | undefined;
}

function describeSchedule(schedule: ScheduleRow): string {
  switch (schedule.scheduleType) {
    case "DAILY":
      return `Daily window ${schedule.startTime}–${schedule.endTime}`;
    case "WEEKLY": {
      const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      return `${days[schedule.dayOfWeek ?? 0]} ${schedule.startTime}–${schedule.endTime}`;
    }
    case "SPECIFIC_DATE":
      return `Scheduled ${schedule.startDate}${schedule.endDate && schedule.endDate !== schedule.startDate ? ` – ${schedule.endDate}` : ""}`;
    case "HOLIDAY":
      return `Holiday: ${schedule.holidayName}`;
    default:
      return "Scheduled";
  }
}

export const availabilityService = {
  // ─── Schedules ───────────────────────────────────────────────────────────

  async listSchedulesForItem(tenantId: string, itemId: string) {
    return availabilityRepository.listSchedulesForItem(tenantId, itemId);
  },

  async createSchedule(
    tenantId: string,
    itemId: string,
    input: CreateScheduleInput,
  ) {
    const item = await availabilityRepository.findItemBasics(tenantId, itemId);
    if (!item) throw itemNotFound(itemId);

    if (
      input.scheduleType === "DAILY" &&
      (!input.startTime || !input.endTime)
    ) {
      throw invalidScheduleFields("DAILY schedules need startTime and endTime");
    }
    if (
      input.scheduleType === "WEEKLY" &&
      (input.dayOfWeek == null || !input.startTime || !input.endTime)
    ) {
      throw invalidScheduleFields(
        "WEEKLY schedules need dayOfWeek, startTime and endTime",
      );
    }
    if (input.scheduleType === "SPECIFIC_DATE" && !input.startDate) {
      throw invalidScheduleFields(
        "SPECIFIC_DATE schedules need at least a startDate",
      );
    }
    if (input.scheduleType === "HOLIDAY" && !input.holidayName) {
      throw invalidScheduleFields("HOLIDAY schedules need a holidayName");
    }

    return availabilityRepository.createSchedule({
      tenantId,
      menuItemId: itemId,
      ...input,
    });
  },

  async updateSchedule(
    tenantId: string,
    scheduleId: string,
    input: UpdateScheduleInput,
  ) {
    const updated = await availabilityRepository.updateSchedule(
      tenantId,
      scheduleId,
      input,
    );
    if (!updated) throw scheduleNotFound(scheduleId);
    return updated;
  },

  // Fire-and-forget, same as item/table soft-deletes elsewhere: deleting a
  // schedule that doesn't exist is a no-op, not a 404.
  async deleteSchedule(tenantId: string, scheduleId: string): Promise<void> {
    await availabilityRepository.deleteSchedule(tenantId, scheduleId);
  },

  // ─── Holidays ────────────────────────────────────────────────────────────
  // No not-found handling on update/delete in the pre-refactor endpoints —
  // preserved as-is (a no-op on a missing holiday, not a 404).

  async listHolidays(
    tenantId: string,
    year?: number | undefined,
    region?: string | undefined,
  ) {
    return availabilityRepository.listHolidays(tenantId, year, region);
  },

  async createHoliday(
    tenantId: string,
    data: { name: string; holidayDate: string; region?: string | undefined },
  ) {
    return availabilityRepository.createHoliday(tenantId, data);
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
    return availabilityRepository.updateHoliday(tenantId, holidayId, data);
  },

  async deleteHoliday(tenantId: string, holidayId: string): Promise<void> {
    await availabilityRepository.deleteHoliday(tenantId, holidayId);
  },

  // ─── Effective status ────────────────────────────────────────────────────

  async isScheduleActive(
    tenantId: string,
    schedule: ScheduleRow,
    now: Date,
  ): Promise<boolean> {
    if (!schedule.isActive) return false;
    switch (schedule.scheduleType) {
      case "DAILY":
        if (!schedule.startTime || !schedule.endTime) return false;
        return timeInRange(
          formatTime(now),
          schedule.startTime,
          schedule.endTime,
        );

      case "WEEKLY":
        if (
          schedule.dayOfWeek == null ||
          !schedule.startTime ||
          !schedule.endTime
        )
          return false;
        // Overnight WEEKLY windows (e.g. Fri 22:00 -> 02:00) would technically
        // span into the next day-of-week; kept simple here (same-day match
        // only) since that's the overwhelmingly common case for a weekly
        // special.
        return (
          now.getDay() === schedule.dayOfWeek &&
          timeInRange(formatTime(now), schedule.startTime, schedule.endTime)
        );

      case "SPECIFIC_DATE": {
        if (!schedule.startDate) return false;
        const today = formatDate(now);
        const end = schedule.endDate ?? schedule.startDate;
        return today >= schedule.startDate && today <= end;
      }

      case "HOLIDAY": {
        if (!schedule.holidayName) return false;
        const today = formatDate(now);
        const match = await availabilityRepository.findHoliday(
          tenantId,
          schedule.holidayName,
          today,
        );
        return !!match;
      }

      default:
        return false;
    }
  },

  // Determines what an item's status actually is right now, factoring in
  // any active schedule — falls back to the item's stored base status when
  // nothing's currently in effect. When multiple schedules overlap, the
  // most specific one wins (a holiday override beats a recurring weekly
  // special, which beats a daily one).
  async getEffectiveStatus(
    tenantId: string,
    itemId: string,
    branchId?: string | undefined,
    at: Date = new Date(),
  ): Promise<{ status: MenuItemStatus; reason: string }> {
    const item = await availabilityRepository.findItemBasics(tenantId, itemId);
    if (!item) throw itemNotFound(itemId);

    const schedules = await availabilityRepository.findActiveSchedulesForItem(
      tenantId,
      itemId,
      branchId,
    );

    let best: { schedule: ScheduleRow; priority: number } | null = null;
    for (const schedule of schedules) {
      const active = await availabilityService.isScheduleActive(
        tenantId,
        schedule,
        at,
      );
      if (!active) continue;
      const priority = SCHEDULE_TYPE_PRIORITY[schedule.scheduleType];
      if (!best || priority > best.priority) best = { schedule, priority };
    }

    if (best) {
      return {
        status: best.schedule.statusDuringPeriod,
        reason: describeSchedule(best.schedule),
      };
    }
    return {
      status: item.status,
      reason: "No active schedule — using base status",
    };
  },

  // Not currently wired to any endpoint (same as before this migration —
  // preserved for behavior parity rather than dropped as "unused").
  async getItemsAvailableAt(
    tenantId: string,
    branchId: string,
    at: Date = new Date(),
  ) {
    const items = await availabilityRepository.listActiveItemBasics(tenantId);
    const available: string[] = [];
    for (const item of items) {
      const { status } = await availabilityService.getEffectiveStatus(
        tenantId,
        item.id,
        branchId,
        at,
      );
      if (status === "ACTIVE") available.push(item.id);
    }
    return available;
  },

  // ─── Branch overrides ────────────────────────────────────────────────────

  async listOverridesForItem(tenantId: string, itemId: string) {
    return availabilityRepository.listOverridesForItem(tenantId, itemId);
  },

  async upsertOverride(
    tenantId: string,
    itemId: string,
    branchId: string,
    input: UpsertOverrideInput,
  ) {
    const item = await availabilityRepository.findItemBasics(tenantId, itemId);
    if (!item) throw itemNotFound(itemId);
    if (item.branchId !== null) throw itemNotTenantWide();

    const branch = await availabilityRepository.findBranch(tenantId, branchId);
    if (!branch) throw branchNotFoundForOverride(branchId);

    return availabilityRepository.upsertOverride(tenantId, itemId, branchId, {
      price: input.price != null ? String(input.price) : null,
      taxRate: input.taxRate != null ? String(input.taxRate) : null,
      prepTimeMinutes: input.prepTimeMinutes ?? null,
      status: input.status ?? null,
      isHidden: input.isHidden ?? false,
      availabilityReason: input.availabilityReason ?? null,
    });
  },

  async deleteOverride(
    tenantId: string,
    itemId: string,
    branchId: string,
  ): Promise<void> {
    await availabilityRepository.deleteOverride(tenantId, itemId, branchId);
  },

  // The item as it actually appears at a given branch: base item, with
  // scheduling's real-time status layered on top, with any branch override
  // layered on top of that. Precedence (highest wins):
  //   branch override status  >  schedule-driven status  >  base status
  // Price and visibility only come from the override (scheduling doesn't
  // touch either), falling back to the base item when no override exists.
  async getEffectiveItem(tenantId: string, itemId: string, branchId: string) {
    const item = await availabilityRepository.findFullItem(tenantId, itemId);
    if (!item) throw itemNotFound(itemId);

    // Branch-exclusive items never have overrides — they already are the
    // branch-specific version of themselves.
    if (item.branchId !== null) {
      return {
        ...item,
        effectivePrice: item.basePrice,
        effectiveTaxRate: item.taxRate,
        effectivePrepTimeMinutes: item.prepTimeMinutes,
        effectiveStatus: item.status,
        isHidden: false,
        overrideApplied: false,
      };
    }

    const [scheduled, override] = await Promise.all([
      availabilityService.getEffectiveStatus(tenantId, itemId, branchId),
      availabilityRepository.getOverride(tenantId, itemId, branchId),
    ]);

    const effectiveStatus = override?.status ?? scheduled.status;
    const effectivePrice = override?.price ?? item.basePrice;
    const effectiveTaxRate = override?.taxRate ?? item.taxRate;
    const effectivePrepTimeMinutes =
      override?.prepTimeMinutes ?? item.prepTimeMinutes;

    return {
      ...item,
      effectivePrice,
      effectiveTaxRate,
      effectivePrepTimeMinutes,
      effectiveStatus,
      isHidden: override?.isHidden ?? false,
      availabilityReason:
        override?.availabilityReason ?? item.availabilityReason,
      overrideApplied: !!override,
    };
  },
};
