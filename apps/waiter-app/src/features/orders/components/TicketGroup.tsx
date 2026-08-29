import type { KitchenTicket, OrderItemFulfillmentType } from "@pos/types";
import { CheckCircle2 } from "lucide-react";
import {
  Card,
  Button,
  StatusBadge as SharedStatusBadge,
  type StatusTone,
} from "@pos/ui";
import { TICKET_STATUS_LABEL } from "../constants";
import { formatCurrency } from "../utils/orderHelpers";

interface Props {
  ticket: KitchenTicket;
  onMarkServed: (ticketId: string) => void;
  isUpdating: boolean;
}

// Design-system Phase 11, Sprint WA-4: the ticket-status pill now goes
// through the shared `StatusBadge` primitive (Phase 3) with a local
// tone map, the same "genuine 4-tone status, migrate it" reasoning
// `TablesPage`'s table-status badge used in Sprint AD-6 — FIRED/
// PREPARING/READY/SERVED map cleanly onto info/warning/success/neutral,
// unlike order-level `PAID`, which still has no home in the 5-tone
// vocabulary. `TICKET_STATUS_COLOR` (constants.ts) is retired — this
// was its only call site (grepped repo-wide) — `TICKET_STATUS_LABEL`
// is kept, since `StatusBadge` still needs a label string per status.
const TICKET_STATUS_TONE: Record<string, StatusTone> = {
  FIRED: "info",
  PREPARING: "warning",
  READY: "success",
  SERVED: "neutral",
};

export function TicketGroup({ ticket, onMarkServed, isUpdating }: Props) {
  return (
    // `Card` (Phase 2), `rounded-2xl` override — same technique
    // `OrderCard`/`MenuItemCard` already use for this app's rounder
    // mobile card radius (`--radius-lg` is 16px, this app's cards want
    // 24px). `padding="none"` since every section below manages its
    // own `px-4`/`py-*` rather than doubling up on Card's own padding.
    <Card padding="none" className="mx-4 mt-4 rounded-2xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-divider flex items-center justify-between">
        <p className="text-xs font-semibold text-text-disabled uppercase tracking-wide">
          Round {ticket.ticketNumber}
        </p>
        <SharedStatusBadge
          label={TICKET_STATUS_LABEL[ticket.status] ?? ticket.status}
          tone={TICKET_STATUS_TONE[ticket.status] ?? "neutral"}
        />
      </div>
      {ticket.notes && (
        <p className="px-4 py-2 text-xs text-warning bg-warning-surface border-b border-divider">
          📝 {ticket.notes}
        </p>
      )}
      {(["DINE_IN", "TAKEAWAY"] as OrderItemFulfillmentType[]).map(
        (fulfillmentType) => {
          const group = ticket.items.filter(
            (item) => (item.fulfillmentType ?? "DINE_IN") === fulfillmentType,
          );
          if (!group.length) return null;
          return (
            <div key={fulfillmentType}>
              <div className="px-4 py-2 bg-surface-secondary border-b border-divider flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
                  {fulfillmentType === "DINE_IN" ? "Dine-in" : "Takeaway"}
                </span>
                <span className="h-px flex-1 bg-divider" />
              </div>
              {group.map((item, idx) => (
                <div
                  key={item.id}
                  className={`px-4 py-3 flex items-start gap-3 ${idx < group.length - 1 ? "border-b border-divider" : ""}`}
                >
                  <span className="w-6 h-6 bg-primary-surface text-primary rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {item.quantity}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-text-primary">
                      {item.menuItemName}
                      {item.variantName && (
                        <span className="text-text-disabled font-normal">
                          {" "}
                          · {item.variantName}
                        </span>
                      )}
                    </p>
                    {item.modifiers?.map((m, i) => (
                      <p key={i} className="text-xs text-text-disabled">
                        + {m.name}
                      </p>
                    ))}
                    {item.chefNotes && (
                      <p className="text-xs text-warning mt-0.5">
                        📝 {item.chefNotes}
                      </p>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-text-secondary">
                    {formatCurrency(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>
          );
        },
      )}
      {ticket.status === "READY" && (
        <div className="px-4 py-3 border-t border-divider">
          {/* `Button` (Phase 3), `variant="success"` — a genuine
              drop-in: bg-success/text-success-foreground (Phase 9's
              contrast-safe pair) matches the old bg-emerald-600/
              text-white exactly in meaning. `rounded-2xl` overrides
              Button's default `rounded-md`, same override technique as
              Card above. */}
          <Button
            onClick={() => onMarkServed(ticket.id)}
            disabled={isUpdating}
            variant="success"
            className="w-full rounded-2xl"
          >
            <CheckCircle2 className="w-4 h-4" />
            Mark Round Served
          </Button>
        </div>
      )}
    </Card>
  );
}
