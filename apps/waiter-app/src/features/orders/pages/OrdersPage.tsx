import { useState } from 'react';
import { ClipboardList, RefreshCw, Bell } from 'lucide-react';
import { Spinner, IconButton, EmptyState } from '@pos/ui';
import { useOrders } from '../hooks/useOrders';
import { OrderCard } from '../components/OrderCard';

interface Props { onSelectOrder: (id: string) => void; }

// Design-system Phase 11, Sprint WA-4: same "bespoke mobile header
// chrome, not `Page`/`PageHeader`" call `HomePage`/`MenuPage`/
// `OrderDetailPage` already made — only colors and primitives move.
// The filter-tab row stays hand-rolled, retokenized only, same
// "filter chips, not `Tabs`' content-panel-switch shape" reasoning
// `CategoryTabs` (WA-3) and Admin `MenuPage`'s filter chips (AD-9)
// already used.
export function OrdersPage({ onSelectOrder }: Props) {
  const [filter, setFilter] = useState<'active' | 'all'>('active');
  const { data: orders, isLoading, refetch, isFetching } = useOrders();

  const active  = orders?.filter((o) => ['OPEN', 'BILL_REQUESTED'].includes(o.status)) ?? [];
  const ready   = orders?.filter((o) => o.kitchenTickets?.some((t) => t.status === 'READY')) ?? [];
  const display = filter === 'active' ? active : orders ?? [];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface">
        <div>
          <h2 className="font-bold text-text-primary">Orders</h2>
          <p className="text-xs text-text-disabled">{orders?.length ?? 0} total today</p>
        </div>
        {/* `IconButton` (Phase 3) — original had no persistent
            background, just a plain gray icon, so no `bg-*` override
            is needed here the way the back-button circles need one. */}
        <IconButton
          icon={RefreshCw}
          aria-label="Refresh orders"
          onClick={() => refetch()}
          className={isFetching ? 'animate-spin' : ''}
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 px-4 py-3 bg-surface border-b border-border">
        {(['active', 'all'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filter === f ? 'bg-primary text-primary-foreground' : 'bg-surface-secondary text-text-secondary'
            }`}>
            {f === 'active' ? `Active (${active.length})` : 'All'}
          </button>
        ))}
      </div>

      {/* Ready banner */}
      {ready.length > 0 && (
        <div className="mx-3 mt-3 bg-success-surface border border-success/20 rounded-2xl p-3 flex items-center gap-3">
          <Bell className="w-5 h-5 text-success animate-bounce flex-shrink-0" />
          <p className="text-sm font-semibold text-success">
            {ready.length} order{ready.length > 1 ? 's' : ''} ready for pickup!
          </p>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner className="w-6 h-6" />
          </div>
        ) : display.length === 0 ? (
          // `EmptyState` (Phase 7) — a genuine drop-in
          // (icon/title/description), not previously used anywhere in
          // this app (`HomePage`'s own empty state predates this and
          // was built on `Card` instead, WA-1). **Flagged:** the
          // original's `px-8` is tighter than `EmptyState`'s fixed
          // `px-4` at `size="md"` — a small horizontal-padding delta,
          // same category as every other un-matched-token gap flagged
          // in this project.
          <EmptyState
            icon={ClipboardList}
            title="No orders"
            description={filter === 'active' ? 'No active orders right now' : 'No orders placed yet'}
          />
        ) : (
          <div className="px-3 py-3 space-y-2">
            {display.map((order) => (
              <OrderCard key={order.id} order={order} onSelect={onSelectOrder} variant="detailed" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
