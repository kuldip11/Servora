import { X } from 'lucide-react';
import { IconButton } from '@pos/ui';
import type { Order } from '@pos/types';
import { StatusBadge } from './StatusBadge';
import { shortOrderId } from '../utils/orderHelpers';

interface Props {
  order: Order;
  onBack: () => void;
}

// Design-system Phase 11, Sprint WA-4: this page keeps its own bespoke
// mobile header bar rather than moving onto `Page`/`PageHeader` — same
// "this app's chrome doesn't match Admin's desktop page-header shape"
// call `HomePage`/`MenuPage` already made in WA-1/WA-2, only the
// colors and the back button move onto shared primitives.
export function OrderDetailHeader({ order, onBack }: Props) {
  return (
    <div className="bg-surface border-b border-border px-4 py-3 flex items-center gap-3">
      {/* `IconButton` (Phase 3), `size="lg"` + `w-9 h-9` override —
          same technique `MenuPage`'s back button used in Sprint WA-2 to
          reproduce this app's 36px circle with a 20px icon exactly
          (`IconButton`'s own `lg` icon is smaller). Persistent
          `bg-surface-secondary` forced via `className`, since
          `IconButton`'s `ghost` variant only fills on hover — the
          original's `active:bg-gray-200` tap-darken has no equivalent
          prop and is dropped, same accepted trade WA-2 flagged. */}
      <IconButton
        icon={X}
        aria-label="Back to Orders"
        size="lg"
        className="w-9 h-9 rounded-xl bg-surface-secondary hover:bg-surface-secondary"
        onClick={onBack}
      />
      <div className="flex-1">
        <h2 className="font-bold text-text-primary">{shortOrderId(order.id)}</h2>
        <p className="text-xs text-text-disabled">
          {order.type?.replace('_', ' ')}
          {order.table ? ` · Table ${order.table.name}` : ''}
        </p>
      </div>
      <StatusBadge status={order.status} />
    </div>
  );
}
