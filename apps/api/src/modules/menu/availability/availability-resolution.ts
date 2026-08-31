import type { AvailabilityReplayEvidence } from "./availability.types";

export type AvailabilityCause =
  | "MANUAL_OVERRIDE"
  | "MANUAL_COUNT"
  | "CHANNEL_OVERRIDE"
  | "BRANCH_OVERRIDE"
  | "SCHEDULE"
  | "RECIPE_DRIVEN"
  | "BASE_STATUS";

function isScheduleReason(reason: string) {
  return (
    reason.startsWith("Daily window") ||
    reason.startsWith("Scheduled") ||
    reason.startsWith("Holiday:") ||
    /^(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday) /.test(reason)
  );
}

export function resolveEffectiveAvailability(evidence: AvailabilityReplayEvidence) {
  const { item, resolvedStatus } = evidence;
  const branchOverride = evidence.branchOverride ?? undefined;
  const channelOverride = evidence.channelOverride ?? undefined;
  const countDepleted =
    item.manualStockCount !== null && item.manualStockCount <= 0;

  const effectiveStatus = item.manualOverrideStatus
    ? item.manualOverrideStatus
    : countDepleted
      ? resolvedStatus.status
      : (channelOverride?.status ?? branchOverride?.status ?? resolvedStatus.status);

  const availabilityCause: AvailabilityCause = item.manualOverrideStatus
    ? "MANUAL_OVERRIDE"
    : countDepleted
      ? "MANUAL_COUNT"
      : channelOverride?.status || channelOverride?.isHidden
        ? "CHANNEL_OVERRIDE"
        : branchOverride?.status || branchOverride?.isHidden
          ? "BRANCH_OVERRIDE"
          : isScheduleReason(resolvedStatus.reason)
            ? "SCHEDULE"
            : resolvedStatus.reason === "Insufficient inventory"
              ? "RECIPE_DRIVEN"
              : "BASE_STATUS";

  return {
    ...item,
    effectivePrice: branchOverride?.price ?? item.basePrice,
    effectiveTaxRate: branchOverride?.taxRate ?? item.taxRate,
    effectivePrepTimeMinutes:
      branchOverride?.prepTimeMinutes ?? item.prepTimeMinutes,
    effectiveStatus,
    isHidden: channelOverride?.isHidden ?? branchOverride?.isHidden ?? false,
    availabilityReason: item.manualOverrideStatus
      ? (item.manualOverrideReason ?? "Manual availability override")
      : countDepleted
        ? resolvedStatus.reason
        : (channelOverride?.availabilityReason ??
          branchOverride?.availabilityReason ??
          resolvedStatus.reason),
    availabilityCause,
    overrideApplied: Boolean(branchOverride || channelOverride),
  };
}
