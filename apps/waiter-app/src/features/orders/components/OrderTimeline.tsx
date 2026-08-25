import { Clock } from "lucide-react";
import { Card } from "@pos/ui";
import type { Order } from "@pos/types";
import { StatusBadge } from "./StatusBadge";

interface Props {
  order: Order;
}

// Design-system Phase 11, Sprint WA-4: `Card`, `padding="none"` since
// both sections manage their own `px-4 py-3`, same pattern
// `TicketGroup` uses above. Per-status pill already goes through the
// shared `StatusBadge` — unchanged by this sprint, it was already
// wired that way.
export function OrderTimeline({ order }: Props) {
  if (!order.statusHistory || order.statusHistory.length === 0) return null;

  return (
    <Card padding="none" className="mx-4 mt-3 mb-6 rounded-2xl overflow-hidden">
      <p className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide border-b border-divider">
        Timeline
      </p>
      <div className="px-4 py-3 space-y-2">
        {order.statusHistory.map((h) => (
          <div key={h.id} className="flex items-center gap-3">
            <Clock className="w-3.5 h-3.5 text-text-disabled flex-shrink-0" />
            <span className="text-text-disabled text-xs">
              {new Date(h.changedAt).toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <StatusBadge status={h.newStatus} />
          </div>
        ))}
      </div>
    </Card>
  );
}
