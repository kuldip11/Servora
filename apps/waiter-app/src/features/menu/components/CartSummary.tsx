import { Send, Layers, Minus, Plus } from 'lucide-react';
import { BottomSheet, Button, TextInput } from '@pos/ui';
import type { CartItem } from '../types';
import { COURSE_LABELS } from '../constants';
import { cartItemKey } from '../utils/cart';

interface Props {
  cart: CartItem[];
  isAddingToExisting: boolean;
  orderNotes: string;
  onOrderNotesChange: (value: string) => void;
  totalItems: number;
  totalPrice: number;
  isPending: boolean;
  needsTable: boolean;
  onUpdateQty: (key: string, delta: number) => void;
  onSubmit: () => void;
  onClose: () => void;
}

// Design-system Phase 11, Sprint WA-2. One of the 2 hand-rolled `fixed
// inset-0` overlays this app owed the Phase 0 audit (the other is
// `ItemCustomiser.tsx`, rewritten alongside this one) — full rewrite
// onto `BottomSheet` (Phase 5/11), not a drop-in, same "these overlays
// need real rework, not a style pass" framing the audit and Sprint
// AD-8/AD-9's `Dialog` rewrites in Admin already went through.
// `BottomSheet` (not `Dialog`) specifically, per `00-PLAN.md`'s own
// Phase 11 note: "bottom sheets over dialogs" is this app's primary
// overlay pattern, and `BottomSheet` was built for exactly this shape.
export function CartSummary({
  cart,
  isAddingToExisting,
  orderNotes,
  onOrderNotesChange,
  totalItems,
  totalPrice,
  isPending,
  needsTable,
  onUpdateQty,
  onSubmit,
  onClose,
}: Props) {
  return (
    <BottomSheet
      open
      onClose={onClose}
      title={isAddingToExisting ? 'Adding to Order' : 'Cart'}
      footer={
        // `BottomSheet`'s `footer` slot is laid out `flex justify-end
        // gap-2` (built for a Cancel/Confirm button row) — this footer
        // is a full-width vertical stack (notes field, total, submit,
        // warning) instead, so it's wrapped in one `w-full` block
        // rather than passed as loose children, keeping the original
        // full-bleed layout inside that row.
        <div className="w-full space-y-3">
          <TextInput
            placeholder={isAddingToExisting ? 'Notes for this round…' : 'Order notes…'}
            value={orderNotes}
            onChange={(e) => onOrderNotesChange(e.target.value)}
            className="rounded-2xl bg-surface-secondary"
          />
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-text-secondary">Total ({totalItems} items)</span>
            <span className="text-xl font-bold text-text-primary">₹{totalPrice.toFixed(2)}</span>
          </div>
          <Button
            onClick={onSubmit}
            disabled={needsTable}
            loading={isPending}
            className="w-full rounded-2xl py-4"
          >
            <Send className="w-4 h-4" />
            {isPending ? 'Placing…' : isAddingToExisting ? 'Add to Order' : 'Place Order'}
          </Button>
          {needsTable && (
            <p className="text-xs text-danger text-center -mt-1">Select a table to place a dine-in order.</p>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {([1, 2, 3] as const).map((course) => {
          const courseItems = cart.filter((i) => i.course === course);
          if (!courseItems.length) return null;
          return (
            <div key={course}>
              <div className="flex items-center gap-2 mb-2">
                <Layers className="w-3.5 h-3.5 text-text-disabled" />
                <p className="text-xs font-semibold text-text-disabled uppercase tracking-wide">
                  {COURSE_LABELS[course]}
                </p>
              </div>
              {courseItems.map((item) => {
                const key = cartItemKey(item);
                return (
                  <div key={key} className="flex items-start gap-3 py-2">
                    <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                      <button
                        onClick={() => onUpdateQty(key, -1)}
                        aria-label={`Decrease quantity of ${item.name}`}
                        className="w-7 h-7 flex items-center justify-center bg-surface-secondary rounded-full">
                        <Minus className="w-3.5 h-3.5 text-text-secondary" />
                      </button>
                      <span className="text-sm font-bold w-5 text-center">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQty(key, 1)}
                        aria-label={`Increase quantity of ${item.name}`}
                        className="w-7 h-7 flex items-center justify-center bg-primary-surface rounded-full">
                        <Plus className="w-3.5 h-3.5 text-primary" />
                      </button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary">{item.name}</p>
                      {item.variantName && <p className="text-xs text-text-secondary">{item.variantName}</p>}
                      {item.modifiers.map((m) => (
                        <p key={m.optionId} className="text-xs text-text-disabled">
                          + {m.name}{m.quantity > 1 ? ` ×${m.quantity}` : ''}
                        </p>
                      ))}
                      {item.chefNotes && <p className="text-xs text-primary mt-0.5">📝 {item.chefNotes}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-text-primary">₹{(item.unitPrice * item.quantity).toFixed(2)}</p>
                      <p className="text-xs text-text-disabled">₹{item.unitPrice.toFixed(2)} each</p>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </BottomSheet>
  );
}
