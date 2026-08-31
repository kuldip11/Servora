import { Plus, Receipt } from "lucide-react";
import { Button } from "@pos/ui";
import type { Order } from "@pos/types";

interface Props {
  order: Order;
  canRequestBill: boolean;
  canAddItems: boolean;
  canCancel: boolean;
  allTicketsServed: boolean;
  isUpdatingStatus: boolean;
  onRequestBill: () => void;
  onAddItems: () => void;
  onCancel: () => void;
  onTransfer?: (() => void) | undefined;
  onSplit?: (() => void) | undefined;
  onMerge?: (() => void) | undefined;
}

export function OrderActions({
  order,
  canRequestBill,
  canAddItems,
  canCancel,
  allTicketsServed,
  isUpdatingStatus,
  onRequestBill,
  onAddItems,
  onCancel,
  onTransfer,
  onSplit,
  onMerge,
}: Props) {
  if (!canRequestBill && !canAddItems && !canCancel) return null;

  return (
    <div className="bg-surface border-t border-border px-4 py-4 space-y-2">
      {/* **Flagged, not silent — no matching `Button` variant:**
          `Button`'s family is primary/secondary/outline/ghost/link/
          danger/success (Phase 3); there's no `warning` variant, so a
          filled-amber "Request Bill" button (this status's tone
          everywhere else in this feature — see `OrderBanners.tsx`'s
          same note) can't be a genuine drop-in the way `TicketGroup`'s
          `variant="success"` button was. Left as bespoke markup,
          retokenized onto `bg-warning`/`text-warning-foreground`
          directly rather than forced onto `primary` (wrong hue) or
          `danger` (wrong meaning) — same "component doesn't exist yet,
          flag the gap" discipline the `PAID` status color and
          `SplitButton`'s dropdown have carried since Phase 3. */}
      {canRequestBill && (
        <button
          onClick={onRequestBill}
          disabled={isUpdatingStatus}
          className="w-full py-4 bg-warning text-warning-foreground font-bold rounded-2xl flex items-center justify-center gap-2 active:opacity-80 disabled:opacity-60"
        >
          <Receipt className="w-5 h-5" />
          {isUpdatingStatus ? "Updating…" : "Request Bill"}
        </button>
      )}
      {order.status === "OPEN" && !allTicketsServed && (
        <p className="text-xs text-text-disabled text-center">
          All rounds need to be served before requesting the bill.
        </p>
      )}
      {/* `Button` `variant="primary"` — a genuine drop-in for the
          brand-violet CTA; `rounded-2xl` overrides the default
          `rounded-md`, same override technique used throughout this
          app's cards/buttons. `size="lg"` (`px-6 py-3`) is the closest
          size to the original `py-3.5`, not pixel-identical — flagged
          alongside every other un-matched-token delta this project has
          called out rather than pixel-chased. */}
      {canAddItems && (
        <Button onClick={onAddItems} size="lg" className="w-full rounded-2xl">
          <Plus className="w-4 h-4" />
          Add More Items
        </Button>
      )}
      {onTransfer && (
        <Button onClick={onTransfer} variant="secondary" size="lg" className="w-full rounded-2xl">
          Transfer Table
        </Button>
      )}
      {onSplit && (
        <Button onClick={onSplit} variant="secondary" size="lg" className="w-full rounded-2xl">
          Split Bill
        </Button>
      )}
      {onMerge && <Button onClick={onMerge} variant="secondary" size="lg" className="w-full rounded-2xl">Merge Table</Button>}
      {/* **Flagged, not silent — no matching `Button` variant:** the
          original is an unfilled red-outline button (`text-red-500
          border-red-100`), not `Button`'s solid `danger` (filled
          `bg-danger`) or `outline` (primary-colored border). Same gap
          category as "Request Bill" above — left bespoke, retokenized
          onto `text-danger`/`border-danger/20`/`bg-danger-surface`. */}
      {canCancel && (
        <button
          onClick={() => {
            if (confirm("Cancel this order?")) {
              onCancel();
            }
          }}
          className="w-full py-3 text-danger font-semibold text-sm rounded-2xl border border-danger/20 active:bg-danger-surface"
        >
          Cancel Order
        </button>
      )}
    </div>
  );
}
