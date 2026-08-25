import { useCallback } from 'react';
import { Spinner, IconButton } from '@pos/ui';
import { X } from 'lucide-react';
import { useOrder } from '../hooks/useOrder';
import { useUpdateOrderStatus } from '../hooks/useUpdateOrderStatus';
import { useUpdateTicketStatus } from '../hooks/useUpdateTicketStatus';
import { OrderDetailHeader } from '../components/OrderDetailHeader';
import { OrderBanners } from '../components/OrderBanners';
import { TicketGroup } from '../components/TicketGroup';
import { OrderTotals } from '../components/OrderTotals';
import { OrderTimeline } from '../components/OrderTimeline';
import { OrderActions } from '../components/OrderActions';

interface Props {
  orderId: string;
  onBack: () => void;
  onAddItems: (orderId: string) => void;
}

// Design-system Phase 11, Sprint WA-4 — closes out `docs/design-system/
// README.md`'s "Not touched yet, still open for Phase 11" list:
// `OrdersPage`/`OrderDetailPage` and their component set
// (`OrderDetailHeader`/`OrderBanners`/`TicketGroup`/`OrderTotals`/
// `OrderTimeline`/`OrderActions`). `bg-gray-50` → `bg-background`
// below is an exact match, not an approximation — `tokens.css`'s
// `--background` (`#f9fafb`) was pulled 1:1 from this exact class
// (see the token file's own top comment).
export function OrderDetailPage({ orderId, onBack, onAddItems }: Props) {
  const { data: order, isLoading } = useOrder(orderId);
  const updateStatus = useUpdateOrderStatus();
  const updateTicketStatus = useUpdateTicketStatus();

  // Phase 14 memoization-audit correction: this page's own previous
  // "Checked, found no equivalent issue" note (README.md, "Phase 14
  // detail — Performance Pass") was wrong about this file specifically —
  // it reasoned `useUpdateTicketStatus` here is "one order's own
  // mutation, not a shared instance across a list of rows," but the
  // tickets `.map()` below renders one `TicketGroup` *per round*, all
  // sharing this single mutation instance. An order commonly has more
  // than one kitchen ticket (multiple rounds), so `isPending` being one
  // shared boolean reproduces `KitchenBoard`'s exact bug (see that
  // file's own fix and comment): marking one round served was disabling
  // every other ready round's "Mark Round Served" button for the
  // duration of that one request. Scoped via `variables` the same way.
  const isTicketUpdating = useCallback(
    (ticketId: string) =>
      updateTicketStatus.isPending && updateTicketStatus.variables?.ticketId === ticketId,
    [updateTicketStatus.isPending, updateTicketStatus.variables],
  );

  // Stabilized so memoizing `TicketGroup` (a natural next step, not
  // done in this pass) wouldn't be defeated by a fresh inline callback
  // on every render — same reasoning `KitchenBoard`'s `handleUpdateStatus`
  // comment already documents.
  const handleMarkServed = useCallback(
    (ticketId: string) => updateTicketStatus.mutate({ ticketId, status: 'SERVED' }),
    [updateTicketStatus],
  );

  if (isLoading) return (
    <div className="flex flex-col h-screen bg-background">
      <div className="bg-surface border-b border-border px-4 py-3 flex items-center gap-3">
        {/* Same `IconButton` back-button treatment as the loaded
            header (`OrderDetailHeader.tsx`) — kept in sync rather than
            left on raw markup now that the real header has moved. */}
        <IconButton
          icon={X}
          aria-label="Back to Orders"
          size="lg"
          className="w-9 h-9 rounded-xl bg-surface-secondary hover:bg-surface-secondary"
          onClick={onBack}
        />
        <h2 className="font-bold text-text-primary">Order Detail</h2>
      </div>
      <div className="flex justify-center py-12">
        <Spinner className="w-6 h-6" />
      </div>
    </div>
  );

  if (!order) return null;

  const tickets = order.kitchenTickets ?? [];
  const readyTickets = tickets.filter((t) => t.status === 'READY');
  const allTicketsServed = tickets.length > 0 && tickets.every((t) => t.status === 'SERVED');

  const canRequestBill = order.status === 'OPEN' && allTicketsServed;
  const canAddItems    = order.status === 'OPEN';
  const canCancel      = order.status === 'OPEN';

  return (
    <div className="flex flex-col h-screen bg-background">
      <OrderDetailHeader order={order} onBack={onBack} />

      <div className="flex-1 overflow-y-auto">
        <OrderBanners order={order} readyTickets={readyTickets} />

        {tickets.map((ticket) => (
          <TicketGroup
            key={ticket.id}
            ticket={ticket}
            onMarkServed={handleMarkServed}
            isUpdating={isTicketUpdating(ticket.id)}
          />
        ))}

        {order.notes && (
          <div className="mx-4 mt-3 bg-warning-surface border border-warning/20 rounded-2xl px-4 py-3">
            <p className="text-xs font-semibold text-warning mb-1">Order Notes</p>
            <p className="text-sm text-warning">{order.notes}</p>
          </div>
        )}

        <OrderTotals order={order} />
        <OrderTimeline order={order} />
      </div>

      <OrderActions
        order={order}
        canRequestBill={canRequestBill}
        canAddItems={canAddItems}
        canCancel={canCancel}
        allTicketsServed={allTicketsServed}
        isUpdatingStatus={updateStatus.isPending}
        onRequestBill={() => updateStatus.mutate({ id: orderId, status: 'BILL_REQUESTED' })}
        onAddItems={() => onAddItems(orderId)}
        onCancel={() => updateStatus.mutate({ id: orderId, status: 'CANCELLED' })}
      />
    </div>
  );
}
