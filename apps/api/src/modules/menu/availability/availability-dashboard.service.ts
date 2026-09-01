import type { MenuItemStatus } from "@pos/types";
import { availabilityRepository } from "./availability.repository";
import { resolveEffectiveAvailability } from "./availability-resolution";
import {
  highestPriorityActiveSchedule,
  scheduleDate,
} from "./schedule-precedence";
import type {
  AvailabilityChannel,
  AvailabilityFulfillmentType,
  AvailabilityReplayEvidence,
} from "./availability.types";

type DashboardItem = Awaited<
  ReturnType<typeof availabilityRepository.listDashboardItems>
>[number];
type DashboardResolutionData = Awaited<
  ReturnType<typeof availabilityRepository.loadDashboardResolutionData>
>;
type Schedule = DashboardResolutionData["schedules"][number];

type DashboardFilters = {
  channel?: AvailabilityChannel;
  fulfillmentType?: AvailabilityFulfillmentType;
  cause?: string;
};

import { AVAILABILITY_DAY_NAMES } from "./constants";

const describeSchedule = (schedule: Schedule): string => {
  switch (schedule.scheduleType) {
    case "DAILY":
      return `Daily window ${schedule.startTime}–${schedule.endTime}`;
    case "WEEKLY":
      return `${AVAILABILITY_DAY_NAMES[schedule.dayOfWeek ?? 0]} ${schedule.startTime}–${schedule.endTime}`;
    case "SPECIFIC_DATE":
      return `Scheduled ${schedule.startDate}${schedule.endDate && schedule.endDate !== schedule.startDate ? ` – ${schedule.endDate}` : ""}`;
    case "HOLIDAY":
      return `Holiday: ${schedule.holidayName}`;
  }
};

const variantAvailability = (variant: DashboardItem["variants"][number]) => {
  if (variant.manualOverrideStatus) {
    return {
      effectiveStatus: variant.manualOverrideStatus,
      availabilityReason:
        variant.manualOverrideReason ?? "Manual availability override",
      cause: "MANUAL_OVERRIDE",
    } as const;
  }
  if (variant.manualStockCount != null && variant.manualStockCount <= 0) {
    return {
      effectiveStatus: "OUT_OF_STOCK" as const,
      availabilityReason: "Manual stock count depleted",
      cause: "MANUAL_COUNT",
    } as const;
  }
  return {
    effectiveStatus: variant.status,
    availabilityReason: variant.manualOverrideReason,
    cause: "COMPUTED_STATUS",
  } as const;
};

const key = (...parts: Array<string | null>) => {
  return parts.map((part) => part ?? "*").join("|");
};

export const availabilityDashboardService = {
  async getUnavailableDashboard(
    tenantId: string,
    branchIds: string[],
    filters: DashboardFilters,
    asOf: Date,
  ) {
    const channels: AvailabilityChannel[] =
      filters.channel && filters.channel !== "UNSCOPED"
        ? [filters.channel]
        : ["STAFF", "CUSTOMER_QR"];
    const fulfillmentTypes: AvailabilityFulfillmentType[] =
      filters.fulfillmentType && filters.fulfillmentType !== "UNSCOPED"
        ? [filters.fulfillmentType]
        : ["DINE_IN", "TAKEAWAY", "DELIVERY", "ONLINE"];
    const normalizedCause = filters.cause?.trim().toUpperCase();
    const items = await availabilityRepository.listDashboardItems(tenantId);
    const data = await availabilityRepository.loadDashboardResolutionData(
      tenantId,
      items.map((item) => item.id),
      branchIds,
      scheduleDate(asOf),
    );

    const schedulesByItem = new Map<string, Schedule[]>();
    for (const schedule of data.schedules) {
      const entries = schedulesByItem.get(schedule.menuItemId) ?? [];
      entries.push(schedule);
      schedulesByItem.set(schedule.menuItemId, entries);
    }
    const branchOverrides = new Map(
      data.branchOverrides.map((row) => [
        key(row.menuItemId, row.branchId),
        row,
      ]),
    );
    const channelOverrides = new Map(
      data.channelOverrides.map((row) => [
        key(row.menuItemId, row.channel, row.fulfillmentType),
        row,
      ]),
    );
    const holidayNames = new Set(data.holidays.map((row) => row.name));
    const rows: Array<Record<string, unknown>> = [];
    const includeCause = (cause: string) =>
      !normalizedCause || cause.toUpperCase() === normalizedCause;

    for (const branchId of branchIds) {
      for (const item of items) {
        if (item.branchId && item.branchId !== branchId) continue;

        const schedules = (schedulesByItem.get(item.id) ?? []).filter(
          (schedule) =>
            schedule.branchId === null || schedule.branchId === branchId,
        );
        let resolvedStatus: { status: MenuItemStatus; reason: string };
        if (item.manualOverrideStatus) {
          resolvedStatus = {
            status: item.manualOverrideStatus,
            reason: item.manualOverrideReason ?? "Manual availability override",
          };
        } else if (
          item.manualStockCount !== null &&
          item.manualStockCount <= 0
        ) {
          resolvedStatus = {
            status: "OUT_OF_STOCK",
            reason: "Manual stock count depleted",
          };
        } else {
          const best = await highestPriorityActiveSchedule(
            schedules,
            asOf,
            async (name) => holidayNames.has(name),
          );
          resolvedStatus = best
            ? {
                status: best.statusDuringPeriod,
                reason: describeSchedule(best),
              }
            : {
                status: item.status,
                reason:
                  item.availabilityReason ??
                  "No active schedule — using base status",
              };
        }

        for (const channel of channels) {
          for (const fulfillmentType of fulfillmentTypes) {
            const branchOverride =
              item.branchId === null
                ? branchOverrides.get(key(item.id, branchId))
                : undefined;
            const channelOverride =
              channelOverrides.get(key(item.id, channel, fulfillmentType)) ??
              channelOverrides.get(key(item.id, channel, null));
            const evidence: AvailabilityReplayEvidence = {
              item,
              resolvedStatus,
              branchOverride: branchOverride ?? null,
              channelOverride: channelOverride ?? null,
            };
            const resolved = resolveEffectiveAvailability(evidence);

            if (resolved.effectiveStatus !== "ACTIVE" || resolved.isHidden) {
              const reason = resolved.availabilityReason ?? "Unavailable";
              const cause = resolved.availabilityCause ?? "BASE_STATUS";
              if (includeCause(cause)) {
                rows.push({
                  entityType: "ITEM",
                  entityId: item.id,
                  menuItemId: item.id,
                  name: item.name,
                  status: resolved.effectiveStatus,
                  reason,
                  cause,
                  branchId,
                  channel,
                  fulfillmentType,
                });
              }
            }

            for (const variant of item.variants) {
              const variantResolved = variantAvailability(variant);
              if (variantResolved.effectiveStatus !== "ACTIVE") {
                if (includeCause(variantResolved.cause)) {
                  rows.push({
                    entityType: "VARIANT",
                    entityId: variant.id,
                    menuItemId: item.id,
                    name: `${item.name} — ${variant.name}`,
                    status: variantResolved.effectiveStatus,
                    reason:
                      variantResolved.availabilityReason ??
                      "Variant unavailable",
                    cause: variantResolved.cause,
                    branchId,
                    channel,
                    fulfillmentType,
                  });
                }
              }
            }

            for (const link of item.modifierGroupLinks) {
              for (const option of link.group.options) {
                const effectiveAvailability =
                  option.manualOverrideAvailability ??
                  option.computedAvailability;
                if (!effectiveAvailability) {
                  const cause =
                    option.manualOverrideAvailability !== null
                      ? "MANUAL_OVERRIDE"
                      : "RECIPE_DRIVEN";
                  if (includeCause(cause)) {
                    rows.push({
                      entityType: "MODIFIER_OPTION",
                      entityId: option.id,
                      menuItemId: item.id,
                      name: `${item.name} — ${link.group.name}: ${option.name}`,
                      status: "OUT_OF_STOCK",
                      reason:
                        cause === "MANUAL_OVERRIDE"
                          ? "Modifier manually unavailable"
                          : "Modifier unavailable from recipe/inventory state",
                      cause,
                      branchId,
                      channel,
                      fulfillmentType,
                    });
                  }
                }
              }
            }
          }
        }
      }
    }

    return {
      asOf: asOf.toISOString(),
      branches: branchIds,
      channels,
      fulfillmentTypes,
      rows,
    };
  },
};
