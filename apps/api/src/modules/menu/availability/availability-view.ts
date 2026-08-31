import type { MenuItemStatus } from "@pos/types";

export type ModifierAvailabilitySource = {
  computedAvailability: boolean;
  manualOverrideAvailability?: boolean | null | undefined;
};

export function effectiveModifierAvailability(
  option: ModifierAvailabilitySource,
): boolean {
  return option.manualOverrideAvailability ?? option.computedAvailability;
}

export function withEffectiveModifierAvailability<
  T extends ModifierAvailabilitySource,
>(option: T): T & { isAvailable: boolean } {
  return {
    ...option,
    isAvailable: effectiveModifierAvailability(option),
  };
}

export type MenuItemAvailabilitySource = {
  status: MenuItemStatus | string;
  manualOverrideStatus?: MenuItemStatus | string | null | undefined;
  manualStockCount?: number | null | undefined;
};

export function effectiveMenuItemAvailability(
  item: MenuItemAvailabilitySource,
): boolean {
  const effectiveStatus = item.manualOverrideStatus ?? item.status;
  return (
    effectiveStatus === "ACTIVE" &&
    (item.manualStockCount == null || item.manualStockCount > 0)
  );
}

export function withEffectiveMenuItemAvailability<
  T extends MenuItemAvailabilitySource,
>(item: T): T & { isAvailable: boolean } {
  return {
    ...item,
    isAvailable: effectiveMenuItemAvailability(item),
  };
}
