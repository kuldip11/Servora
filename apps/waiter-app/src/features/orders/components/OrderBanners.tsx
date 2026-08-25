import { Bell, Receipt } from "lucide-react";
import type { Order, KitchenTicket } from "@pos/types";

interface Props {
  order: Order;
  readyTickets: KitchenTicket[];
}

// Design-system Phase 11, Sprint WA-4: both banners retokenized onto
// the same status-surface pattern `InventoryPage`'s low-stock alert
// (Sprint AD-2) and `OrderDetailPage`'s (Admin) warning banner
// (Sprint AD-8) already established (`bg-*-surface`/`border-*/20`/
// `text-*`). **Flagged, not silent:** the bill-requested banner was
// literal `orange-*` before, a distinct hue from `--warning`'s amber —
// mapped onto `warning` anyway because that's the exact tone this same
// `BILL_REQUESTED` status already carries in `StatusBadge.tsx`'s own
// `STATUS_TONE` map (self-consistent within this feature, not an
// arbitrary pick), so a small hue shift (orange → amber) is the real,
// worth-a-look visual delta here, same discipline every prior sprint's
// unmatched-token deltas got flagged with.
export function OrderBanners({ order, readyTickets }: Props) {
  return (
    <>
      {readyTickets.length > 0 && (
        <div className="mx-4 mt-4 bg-success-surface border border-success/20 rounded-2xl p-4 flex items-center gap-3">
          <Bell className="w-5 h-5 text-success animate-bounce flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-success">
              {readyTickets.length === 1
                ? "A round is ready for pickup!"
                : `${readyTickets.length} rounds are ready for pickup!`}
            </p>
            <p className="text-xs text-success">
              Collect from kitchen and serve the customer.
            </p>
          </div>
        </div>
      )}

      {order.status === "BILL_REQUESTED" && (
        <div className="mx-4 mt-4 bg-warning-surface border border-warning/20 rounded-2xl p-4 flex items-center gap-3">
          <Receipt className="w-5 h-5 text-warning flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-warning">Bill requested</p>
            <p className="text-xs text-warning">
              Waiting for the cashier to collect payment.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
