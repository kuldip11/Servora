import { memo } from "react";
import { Card } from "@pos/ui";
import type { KitchenTicket, KitchenTicketStatus } from "@pos/types";
import { STATUS_CONFIG } from "../constants";
import { isUrgent, voidUrgency } from "../utils/ticket";
import { TicketHeader } from "./TicketHeader";
import { TicketItems } from "./TicketItems";
import { TicketFooter } from "./TicketFooter";

interface Props {
  ticket: KitchenTicket;
  onUpdateStatus: (id: string, status: KitchenTicketStatus) => void;
  isUpdating: boolean;
}

// Phase 14 memoization-audit finding: this card was unmemoized, so every
// ticket on the board re-rendered on every 20s poll (`useKitchenTickets`)
// and on every single `kitchen.ticket.created`/`updated` websocket event
// (`useKitchenRealtime` invalidates the whole board's query on any one
// ticket's event, not just the changed one) — even tickets whose own data
// hadn't changed at all. `React.memo` only pays off because `KitchenBoard`
// now passes a stable `onUpdateStatus` and a per-ticket `isUpdating` (see
// that file's Phase 14 comment) — memoizing this alone, with the previous
// board-wide `isUpdating` flag and a fresh inline callback each render,
// would have done nothing (every card's props would still look "new"
// every render).
export const TicketCard = memo(function TicketCard({
  ticket,
  onUpdateStatus,
  isUpdating,
}: Props) {
  const cfg = STATUS_CONFIG[ticket.status as keyof typeof STATUS_CONFIG];
  if (!cfg) return null;

  const urgent = isUrgent(ticket.firedAt);
  const voidLevel = voidUrgency(ticket);

  // `Card` (Phase 2) — a genuine drop-in for the surface/padding/
  // radius, with the per-status `border-2` color and the urgent ring
  // layered on via `className` (twMerge resolves `border-2 border-X`
  // over `Card`'s own default `border border-border`). `danger/60`
  // for the urgent ring is an exact match — dark `--danger` is
  // `red-500`, same as the original's literal `ring-red-500/60`.
  return (
    <Card
      padding="md"
      className={`border-2 rounded-xl flex flex-col gap-3 ${cfg.border} ${urgent ? "ring-2 ring-danger/60" : ""}`}
    >
      {voidLevel !== "none" && <div className={`rounded-md px-2 py-1.5 text-xs font-bold ${voidLevel === "danger" ? "bg-danger-surface text-danger" : "bg-warning-surface text-warning"}`}>{voidLevel === "danger" ? "URGENT VOID — stop preparation" : "VOIDED before prep"}</div>}
      <TicketHeader
        ticket={ticket}
        statusLabel={cfg.label}
        statusTone={cfg.badgeTone}
        statusTextClass={cfg.badgeTextClass}
      />
      <TicketItems notes={ticket.notes} items={ticket.items} />
      <TicketFooter
        next={cfg.next}
        nextLabel={cfg.nextLabel}
        btnClass={cfg.btn}
        isUpdating={isUpdating}
        onAdvance={() => cfg.next && onUpdateStatus(ticket.id, cfg.next)}
      />
    </Card>
  );
});
