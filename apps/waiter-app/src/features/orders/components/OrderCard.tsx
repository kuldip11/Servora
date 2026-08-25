import { memo } from 'react';
import { Bell, ChevronRight } from 'lucide-react';
import { Card } from '@pos/ui';
import type { Order } from '@pos/types';
import { StatusBadge } from './StatusBadge';
import { shortOrderId, formatCurrency, isOrderReady } from '../utils/orderHelpers';

interface Props {
  order: Order;
  onSelect: (id: string) => void;
  /** 'compact' — Home's single-line card. 'detailed' — Orders list card with item preview. */
  variant?: 'compact' | 'detailed';
}

// Phase 11: rebuilt on `Card` (Phase 2) instead of the hand-rolled
// `bg-white rounded-2xl ... border shadow-sm` shell — `00-PLAN.md`
// names this file directly ("HomePage/OrderCard are good visual
// references, just need to move onto shared primitives"). `Card`'s
// own `rounded-lg` (16px) is overridden back to `rounded-2xl` (24px,
// `--radius-xl`) via `className` (`cn`'s `tailwind-merge` resolves the
// conflict in the later class's favor, same technique `TablesPage`'s
// per-status border override used in Sprint AD-6) — `Card` has no
// `radius` prop, and this app's cards have always been a step rounder
// than Admin's, a real mobile-vs-desktop visual choice worth keeping,
// not a gap to paper over by forcing 16px everywhere.
// Phase 14 (perf pass, follow-up): wrapped in `React.memo`. Flagged in
// the prior pass as lower priority than `KitchenBoard`'s fix (no
// 20-second poll + shared per-row mutation flag driving this list the
// way Kitchen Display's board was), but a real, if smaller, win: both
// call sites (`OrdersPage`, `HomePage`) pass `onSelectOrder` straight
// through unwrapped rather than a fresh inline arrow per render, so
// this card's props are already stable across an unrelated parent
// re-render — `memo` here isn't fighting an inline-callback problem
// the way `MenuItemCard`'s did.
export const OrderCard = memo(function OrderCard({ order, onSelect, variant = 'detailed' }: Props) {
  const ready = isOrderReady(order);

  if (variant === 'compact') {
    return (
      <Card
        as="button"
        onClick={() => onSelect(order.id)}
        padding="md"
        className={`w-full text-left rounded-2xl flex items-center gap-3 active:scale-95 transition-transform ${
          ready ? 'border-success ring-1 ring-success/30' : ''
        }`}
      >
        {ready && <Bell className="w-4 h-4 text-success animate-bounce flex-shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-sm text-text-primary">{shortOrderId(order.id)}</span>
            {order.table && (
              <span className="text-xs text-text-disabled">Table {order.table.name}</span>
            )}
          </div>
          <p className="text-xs text-text-disabled mt-0.5">
            {order.items?.length ?? 0} items · {formatCurrency(order.totalAmount)}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={order.status} />
          <ChevronRight className="w-4 h-4 text-text-disabled" />
        </div>
      </Card>
    );
  }

  return (
    <Card
      as="button"
      onClick={() => onSelect(order.id)}
      padding="md"
      className={`w-full text-left rounded-2xl active:scale-95 transition-transform ${
        ready ? 'border-success ring-1 ring-success/30' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {ready && <Bell className="w-4 h-4 text-success animate-bounce" />}
          <span className="font-mono font-bold text-sm text-text-primary">{shortOrderId(order.id)}</span>
          {order.table && (
            <span className="text-xs bg-surface-secondary text-text-secondary px-2 py-0.5 rounded-full">
              Table {order.table.name}
            </span>
          )}
        </div>
        <StatusBadge status={order.status} />
      </div>
      <div className="space-y-0.5 mb-2">
        {order.items?.slice(0, 2).map((item) => (
          <p key={item.id} className="text-xs text-text-secondary">
            {item.quantity}× {item.menuItemName}
          </p>
        ))}
        {(order.items?.length ?? 0) > 2 && (
          <p className="text-xs text-text-disabled">
            +{(order.items?.length ?? 0) - 2} more
          </p>
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-disabled">{order.type?.replace('_', ' ')}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold text-text-primary">{formatCurrency(order.totalAmount)}</span>
          <ChevronRight className="w-4 h-4 text-text-disabled" />
        </div>
      </div>
    </Card>
  );
});
