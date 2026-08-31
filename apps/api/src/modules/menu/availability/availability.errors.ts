import { NotFoundError, ValidationError } from "@/core/errors";

export const itemNotFound = (id?: string): NotFoundError => {
  return new NotFoundError("Menu item", id);
};

export const scheduleNotFound = (id?: string): NotFoundError => {
  return new NotFoundError("Schedule", id);
};

export const branchNotFoundForOverride = (id?: string): NotFoundError => {
  return new NotFoundError("Branch", id);
};

export const itemNotTenantWide = (): ValidationError => {
  return new ValidationError(
    "Only tenant-wide items can have branch overrides",
    {
      reason: "ITEM_NOT_TENANT_WIDE",
    },
  );
};

export const invalidScheduleFields = (message: string): ValidationError => {
  return new ValidationError(message, { reason: "INVALID_SCHEDULE_FIELDS" });
};

export const manualOverrideReasonRequired = (): ValidationError => {
  return new ValidationError(
    "A reason is required for a manual availability override",
    {
      reason: "MANUAL_OVERRIDE_REASON_REQUIRED",
    },
  );
};
