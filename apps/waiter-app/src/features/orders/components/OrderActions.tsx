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
      {

                                                                 }
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
      {

                                                 }
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
      {

                                                                       }
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
