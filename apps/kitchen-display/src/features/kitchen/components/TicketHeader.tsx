import { StatusBadge, type StatusTone } from "@pos/ui";
import type { KitchenTicket } from "@pos/types";
import { Timer } from "./Timer";

interface Props {
  ticket: KitchenTicket;
  statusLabel: string;
  statusTone: StatusTone;
  statusTextClass: string;
}

// `text-white` → `text-text-primary` below: dark theme's
// `--text-primary` is `#f9fafb` (gray-50), not pure `#ffffff` — an
// imperceptible, standard token-vs-literal delta, not flagged again at
// every other place this same swap recurs in this sprint's files.
export function TicketHeader({
  ticket,
  statusLabel,
  statusTone,
  statusTextClass,
}: Props) {
  const order = ticket.order;
  const tableName = order?.table?.name;
  const orderTypeLabel = order?.type?.replace("_", " ").toLowerCase();
  const isTakeaway = order?.type === "TAKEAWAY";

  return (
    <div className="flex items-start justify-between">
      <div>
        <p className="text-text-primary font-bold text-sm">
          {tableName
            ? `Table ${tableName}`
            : isTakeaway
              ? "Takeaway"
              : orderTypeLabel}
          {ticket.ticketNumber > 1 && (
            <span className="ml-2 text-xs font-semibold text-text-secondary">
              Round {ticket.ticketNumber}
            </span>
          )}
        </p>
        <p className="text-xs text-text-secondary mt-0.5">
          {tableName ? orderTypeLabel : isTakeaway ? "Pickup order" : null}
        </p>
      </div>
      <div className="text-right">
        {/* `StatusBadge` (Phase 3) — closes out the last of the audit's
            "3 independent status-badge implementations" (Admin's menu
            status and Waiter App's order status were already on it).
            `dot={false}` matches the original, which had no dot
            indicator — just a colored label. `className` overrides the
            primitive's own `text-{tone}` (the `-500` token) with the
            legibility-tuned `-400` shade `constants.ts`'s
            `badgeTextClass` carries, same reasoning as that file's own
            comment. **Flagged, small deltas accepted, not chased:**
            the primitive's `bg-{tone}-surface` is `-500`/15% opacity in
            dark theme vs. the original's literal `/20%`, and its
            `font-semibold px-2.5` vs. the original's `font-bold px-2`
            — both close enough not to override further. */}
        <StatusBadge
          label={statusLabel}
          tone={statusTone}
          dot={false}
          className={statusTextClass}
        />
        <Timer firedAt={ticket.firedAt} />
      </div>
    </div>
  );
}
