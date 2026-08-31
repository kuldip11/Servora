import { StatusBadge as UiStatusBadge } from "@pos/ui";
import type { MenuItemStatus } from "@pos/types";
import { MENU_ITEM_STATUS_META } from "../constants";

export function StatusBadge({ status }: { status: MenuItemStatus }) {
  const meta = MENU_ITEM_STATUS_META[status] ?? MENU_ITEM_STATUS_META.ACTIVE;
  return <UiStatusBadge label={meta.label} tone={meta.tone} />;
}
