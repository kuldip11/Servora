/**
 * Menu availability application service: schedule/override validation,
 * persistence orchestration, inventory-driven signals, and effective-status
 * lookup. Pure precedence resolution lives in `availability-resolution.ts`.
 */
import type {
  MenuItemStatus,
  MenuItemScheduleType,
  OrderType,
} from "@pos/types";
import { availabilityRepository } from "./availability.repository";
import {
  itemNotFound,
  scheduleNotFound,
  branchNotFoundForOverride,
  itemNotTenantWide,
  invalidScheduleFields,
  manualOverrideReasonRequired,
} from "./availability.errors";
import {
  highestPriorityActiveSchedule,
  scheduleMatches,
} from "./schedule-precedence";
import { writeAudit } from "../../../core/audit";
import { eventBus } from "../../../lib/event-bus";
import { ValidationError } from "../../../core/errors";

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

export type {
  AvailabilityChannel,
  AvailabilityContext,
  AvailabilityFulfillmentType,
  AvailabilityReplayEvidence,
  AvailabilityReplayItem,
  AvailabilityReplayOverride,
} from "./availability.types";
import type {
  AvailabilityChannel,
  AvailabilityContext,
  AvailabilityFulfillmentType,
  AvailabilityReplayEvidence,
} from "./availability.types";
import { resolveEffectiveAvailability } from "./availability-resolution";
import { availabilityDashboardService } from "./availability-dashboard.service";

export interface ManualOverrideInput {
  status: MenuItemStatus;
  reason: string;
}

export interface UpsertOverrideInput {
  price?: number | null | undefined;
  taxRate?: number | null | undefined;
  prepTimeMinutes?: number | null | undefined;
  status?: MenuItemStatus | null | undefined;
  isHidden?: boolean | undefined;
  availabilityReason?: string | null | undefined;
}
export interface UpsertChannelOverrideInput {
  channel: "STAFF" | "CUSTOMER_QR";
  fulfillmentType?: OrderType | null | undefined;
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
  getUnavailableDashboard: availabilityDashboardService.getUnavailableDashboard,
  async getEffectiveVariant(tenantId: string, variantId: string) {
    const variant = await availabilityRepository.findVariant(variantId);
    if (!variant || variant.menuItem.tenantId !== tenantId)
      throw itemNotFound(variantId);
    if (variant.manualOverrideStatus) {
      return {
        ...variant,
        effectiveStatus: variant.manualOverrideStatus,
        availabilityReason:
          variant.manualOverrideReason ?? "Manual availability override",
      };
    }
    if (variant.manualStockCount != null && variant.manualStockCount <= 0) {
      return {
        ...variant,
        effectiveStatus: "OUT_OF_STOCK" as const,
        availabilityReason: "Manual stock count depleted",
      };
    }
    return {
      ...variant,
      effectiveStatus: variant.status,
      availabilityReason: variant.manualOverrideReason,
    };
  },
  async setVariantOverride(
    tenantId: string,
    variantId: string,
    status: MenuItemStatus | null,
    reason: string | null,
  ) {
    await availabilityService.getEffectiveVariant(tenantId, variantId);
    return availabilityRepository.setVariantOverride(
      variantId,
      status,
      status ? reason?.trim() || "Variant manually unavailable" : null,
    );
  },

  async applyInventoryItemSignal(
    tenantId: string,
    branchId: string,
    itemId: string,
    canSatisfy: boolean,
  ) {
    const item = await availabilityRepository.findItemBasics(tenantId, itemId);
    if (!item) throw itemNotFound(itemId);
    if (item.branchId !== null && item.branchId !== branchId) return item;
    if (item.status !== "ACTIVE" && item.status !== "OUT_OF_STOCK") return item;
    const computedStatus = canSatisfy ? "ACTIVE" : "OUT_OF_STOCK";
    const reason = canSatisfy ? null : "Insufficient inventory";
    if (item.status === computedStatus && item.availabilityReason === reason)
      return item;
    const updated = await availabilityRepository.setComputedItemStatus(
      tenantId,
      itemId,
      computedStatus,
      reason,
    );
    if (!updated) throw itemNotFound(itemId);
    const effectiveStatus = item.manualOverrideStatus ?? computedStatus;
    await Promise.all([
      writeAudit({
        tenantId,
        branchId,
        userId: null,
        action: "MENU_AVAILABILITY_COMPUTED_CHANGED",
        entity: "menu_item",
        entityId: itemId,
        metadata: {
          source: "INVENTORY",
          computedStatus,
          effectiveStatus,
          reason,
        },
      }),
      eventBus.publish(
        {
          type: "menu.availability.updated",
          payload: {
            source: "INVENTORY",
            entityType: "ITEM",
            entityId: itemId,
            menuItemId: itemId,
            computedStatus,
            effectiveStatus,
            reason,
          },
        },
        tenantId,
        branchId,
      ),
    ]);
    return updated;
  },

  async applyInventoryVariantSignal(
    tenantId: string,
    branchId: string,
    variantId: string,
    canSatisfy: boolean,
  ) {
    const variant = await availabilityRepository.findVariant(variantId);
    if (!variant || variant.menuItem.tenantId !== tenantId)
      throw itemNotFound(variantId);
    if (
      variant.menuItem.branchId !== null &&
      variant.menuItem.branchId !== branchId
    )
      return variant;
    if (variant.status !== "ACTIVE" && variant.status !== "OUT_OF_STOCK")
      return variant;
    const computedStatus = canSatisfy ? "ACTIVE" : "OUT_OF_STOCK";
    if (variant.status === computedStatus) return variant;
    const updated = await availabilityRepository.setComputedVariantStatus(
      variantId,
      computedStatus,
    );
    const effectiveStatus = variant.manualOverrideStatus ?? computedStatus;
    await Promise.all([
      writeAudit({
        tenantId,
        branchId,
        userId: null,
        action: "MENU_AVAILABILITY_COMPUTED_CHANGED",
        entity: "menu_item_variant",
        entityId: variantId,
        metadata: {
          source: "INVENTORY",
          menuItemId: variant.menuItemId,
          computedStatus,
          effectiveStatus,
        },
      }),
      eventBus.publish(
        {
          type: "menu.availability.updated",
          payload: {
            source: "INVENTORY",
            entityType: "VARIANT",
            entityId: variantId,
            menuItemId: variant.menuItemId,
            computedStatus,
            effectiveStatus,
            reason:
              computedStatus === "OUT_OF_STOCK"
                ? "Insufficient inventory"
                : null,
          },
        },
        tenantId,
        branchId,
      ),
    ]);
    return updated;
  },

  async applyInventoryModifierSignal(
    tenantId: string,
    branchId: string,
    menuItemId: string,
    optionId: string,
    canSatisfy: boolean,
  ) {
    const option = await availabilityRepository.findModifierOptionForItem(
      tenantId,
      menuItemId,
      optionId,
    );
    if (!option) throw itemNotFound(optionId);
    if (option.computedAvailability === canSatisfy) return option;
    const effectiveAvailability =
      option.manualOverrideAvailability ?? canSatisfy;
    const updated =
      await availabilityRepository.setComputedModifierAvailability(
        optionId,
        canSatisfy,
      );
    await Promise.all([
      writeAudit({
        tenantId,
        branchId,
        userId: null,
        action: "MENU_AVAILABILITY_COMPUTED_CHANGED",
        entity: "modifier_option",
        entityId: optionId,
        metadata: {
          source: "INVENTORY",
          menuItemId,
          computedAvailability: canSatisfy,
          effectiveAvailability,
        },
      }),
      eventBus.publish(
        {
          type: "menu.availability.updated",
          payload: {
            source: "INVENTORY",
            entityType: "MODIFIER_OPTION",
            entityId: optionId,
            menuItemId,
            computedAvailability: canSatisfy,
            effectiveAvailability,
            reason: canSatisfy ? null : "Insufficient inventory",
          },
        },
        tenantId,
        branchId,
      ),
    ]);
    return updated;
  },
  async setManualStockCount(
    tenantId: string,
    branchId: string | null | undefined,
    itemId: string,
    count: number | null,
    variantId?: string | null,
  ) {
    if (count !== null && (!Number.isInteger(count) || count < 0))
      throw new ValidationError(
        "Manual stock count must be a non-negative integer or null",
      );
    const updated = await availabilityRepository.setManualStockCount(
      tenantId,
      itemId,
      count,
      variantId,
    );
    if (!updated) throw itemNotFound(variantId ?? itemId);
    await eventBus.publish(
      {
        type: "menu.availability.updated",
        payload: {
          source: "MANUAL_STOCK_COUNT",
          entityType: updated.entityType,
          entityId: variantId ?? itemId,
          menuItemId: itemId,
          manualStockCount: count,
          ...(count === 0 ? { effectiveStatus: "OUT_OF_STOCK" as const } : {}),
        },
      },
      tenantId,
      branchId ?? undefined,
    );
    return updated;
  },

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
    return scheduleMatches(
      schedule,
      now,
      async (name, date) =>
        !!(await availabilityRepository.findHoliday(tenantId, name, date)),
    );
  },

  // Determines what an item's status actually is right now, factoring in
  // any active schedule — falls back to the item's stored base status when
  // nothing's currently in effect. When multiple schedules overlap, the
  // most specific one wins (a holiday override beats a recurring weekly
  // special, which beats a daily one).
  async getEffectiveStatus(
    tenantId: string,
    itemId: string,
    branchId: string | undefined,
    context: AvailabilityContext,
  ): Promise<{ status: MenuItemStatus; reason: string }> {
    const item = await availabilityRepository.findItemBasics(tenantId, itemId);
    if (!item) throw itemNotFound(itemId);

    // Layer 1 (highest): a human-set operational override. Short-circuit here
    // so lower computed layers cannot accidentally supersede or clear it.
    if (item.manualOverrideStatus) {
      return {
        status: item.manualOverrideStatus,
        reason: item.manualOverrideReason ?? "Manual availability override",
      };
    }

    // G4: finite batch/count stock is a computed 86 signal. It sits below
    // the human override and above schedules/branch presentation layers so a
    // zero count cannot be sold concurrently unless a manager explicitly
    // overrides availability.
    if (item.manualStockCount !== null && item.manualStockCount <= 0) {
      return { status: "OUT_OF_STOCK", reason: "Manual stock count depleted" };
    }

    const schedules = await availabilityRepository.findActiveSchedulesForItem(
      tenantId,
      itemId,
      branchId,
    );

    const best = await highestPriorityActiveSchedule(
      schedules,
      context.asOf,
      async (name, date) =>
        !!(await availabilityRepository.findHoliday(tenantId, name, date)),
    );

    if (best) {
      return {
        status: best.statusDuringPeriod,
        reason: describeSchedule(best),
      };
    }
    return {
      status: item.status,
      reason:
        item.availabilityReason ?? "No active schedule — using base status",
    };
  },

  // ─── Manual availability override ───────────────────────────────────────

  async setManualOverride(
    tenantId: string,
    itemId: string,
    input: ManualOverrideInput,
    userId: string,
  ) {
    const item = await availabilityRepository.findItemBasics(tenantId, itemId);
    if (!item) throw itemNotFound(itemId);
    const reason = input.reason.trim();
    if (!reason) throw manualOverrideReasonRequired();
    return availabilityRepository.setManualOverride(
      tenantId,
      itemId,
      input.status,
      reason,
      userId,
    );
  },

  async clearManualOverride(tenantId: string, itemId: string) {
    const item = await availabilityRepository.findItemBasics(tenantId, itemId);
    if (!item) throw itemNotFound(itemId);
    return availabilityRepository.clearManualOverride(tenantId, itemId);
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
  async listChannelOverrides(tenantId: string, itemId: string) {
    return availabilityRepository.listChannelOverrides(tenantId, itemId);
  },
  async upsertChannelOverride(
    tenantId: string,
    itemId: string,
    input: UpsertChannelOverrideInput,
  ) {
    if (!(await availabilityRepository.findItemBasics(tenantId, itemId)))
      throw itemNotFound(itemId);
    return availabilityRepository.upsertChannelOverride(
      tenantId,
      itemId,
      input.channel,
      input.fulfillmentType ?? null,
      {
        status: input.status ?? null,
        isHidden: input.isHidden ?? false,
        availabilityReason: input.availabilityReason ?? null,
      },
    );
  },
  async deleteChannelOverride(tenantId: string, id: string) {
    await availabilityRepository.deleteChannelOverride(tenantId, id);
  },

  // The item as it actually appears at a given branch. Status precedence is
  // explicit and stable: manual override > branch override > active schedule
  // > base/computed status. Price and visibility still come from the branch
  // override and fall back to the base item.
  async getEffectiveItemWithEvidence(
    tenantId: string,
    itemId: string,
    branchId: string,
    context: AvailabilityContext,
  ) {
    let evidence: AvailabilityReplayEvidence;

    if (context.historicalReplay) {
      evidence = context.historicalReplay;
      if (evidence.item.id !== itemId) throw itemNotFound(itemId);
    } else {
      const item = await availabilityRepository.findFullItem(tenantId, itemId);
      if (!item) throw itemNotFound(itemId);

      const [resolvedStatus, override, channelOverride] = await Promise.all([
        availabilityService.getEffectiveStatus(tenantId, itemId, branchId, context),
        item.branchId === null
          ? availabilityRepository.getOverride(tenantId, itemId, branchId)
          : Promise.resolve(undefined),
        context.channel !== "UNSCOPED" && context.fulfillmentType !== "UNSCOPED"
          ? availabilityRepository.getChannelOverride(
              tenantId,
              itemId,
              context.channel,
              context.fulfillmentType,
            )
          : Promise.resolve(undefined),
      ]);
      evidence = {
        // Preserve the complete item row/relations used by the live resolver so
        // historical replay returns the same shape without consulting today's menu.
        item,
        resolvedStatus,
        branchOverride: override
          ? {
              status: override.status,
              price: override.price,
              taxRate: override.taxRate,
              prepTimeMinutes: override.prepTimeMinutes,
              isHidden: override.isHidden,
              availabilityReason: override.availabilityReason,
            }
          : null,
        channelOverride: channelOverride
          ? {
              status: channelOverride.status,
              isHidden: channelOverride.isHidden,
              availabilityReason: channelOverride.availabilityReason,
            }
          : null,
      };
    }

    return {
      evidence,
      effective: resolveEffectiveAvailability(evidence),
    };
  },

  async getEffectiveItem(
    tenantId: string,
    itemId: string,
    branchId: string,
    context: AvailabilityContext,
  ) {
    return (await availabilityService.getEffectiveItemWithEvidence(
      tenantId,
      itemId,
      branchId,
      context,
    )).effective;
  },
};
