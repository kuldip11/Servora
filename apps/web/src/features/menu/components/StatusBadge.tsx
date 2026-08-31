import { StatusBadge as UiStatusBadge, type StatusTone } from "@pos/ui";
import type { MenuItemStatus } from "@pos/types";

const STATUS_META: Record<MenuItemStatus, { label: string; tone: StatusTone }> =
  {
    ACTIVE: { label: "Active", tone: "success" },
    OUT_OF_STOCK: { label: "Out of Stock", tone: "danger" },
    HIDDEN: { label: "Hidden", tone: "warning" },
    SEASONAL: { label: "Seasonal", tone: "info" },
    DISCONTINUED: { label: "Discontinued", tone: "neutral" },
  };

export const STATUS_OPTIONS: { value: MenuItemStatus; label: string }[] = (
  Object.keys(STATUS_META) as MenuItemStatus[]
).map((value) => ({ value, label: STATUS_META[value].label }));

export function StatusBadge({ status }: { status: MenuItemStatus }) {
  const meta = STATUS_META[status] ?? STATUS_META.ACTIVE;
  return <UiStatusBadge label={meta.label} tone={meta.tone} />;
}
