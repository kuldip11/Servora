/** Menu-availability error factories for schedules, holidays, overrides, and effective-status resolution. */
import { NotFoundError, ValidationError } from "../../../core/errors";

export function itemNotFound(id?: string): NotFoundError {
  return new NotFoundError("Menu item", id);
}

export function scheduleNotFound(id?: string): NotFoundError {
  return new NotFoundError("Schedule", id);
}

export function branchNotFoundForOverride(id?: string): NotFoundError {
  return new NotFoundError("Branch", id);
}

export function itemNotTenantWide(): ValidationError {
  return new ValidationError(
    "Only tenant-wide items can have branch overrides",
    {
      reason: "ITEM_NOT_TENANT_WIDE",
    },
  );
}

export function invalidScheduleFields(message: string): ValidationError {
  return new ValidationError(message, { reason: "INVALID_SCHEDULE_FIELDS" });
}

export function manualOverrideReasonRequired(): ValidationError {
  return new ValidationError("A reason is required for a manual availability override", {
    reason: "MANUAL_OVERRIDE_REASON_REQUIRED",
  });
}
