import { StatusBadge as UiStatusBadge, type StatusTone } from '@pos/ui';
import type { MenuItemStatus } from '@pos/types';

// Migrated onto @pos/ui's Phase 3 StatusBadge primitive
// (docs/design-system/00-PLAN.md) — see that component's doc comment.
// This domain's 5 statuses already mapped 1:1 onto the primitive's 5
// tones, so this is an exact swap with zero visual change.
const STATUS_META: Record<MenuItemStatus, { label: string; tone: StatusTone }> = {
  ACTIVE: { label: 'Active', tone: 'success' },
  OUT_OF_STOCK: { label: 'Out of Stock', tone: 'danger' },
  HIDDEN: { label: 'Hidden', tone: 'warning' },
  SEASONAL: { label: 'Seasonal', tone: 'info' },
  DISCONTINUED: { label: 'Discontinued', tone: 'neutral' },
};

export const STATUS_OPTIONS: { value: MenuItemStatus; label: string }[] = (
  Object.keys(STATUS_META) as MenuItemStatus[]
).map((value) => ({ value, label: STATUS_META[value].label }));

export function StatusBadge({ status }: { status: MenuItemStatus }) {
  const meta = STATUS_META[status] ?? STATUS_META.ACTIVE;
  return <UiStatusBadge label={meta.label} tone={meta.tone} />;
}
