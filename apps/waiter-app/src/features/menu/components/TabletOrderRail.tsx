import { Minus, Pencil, Plus, ShoppingBag } from "lucide-react";
import type { CartItem } from "@/features/menu/types";
import type { WaiterComboCartLine } from "@/features/menu/combo";
import { comboLineKey } from "@/features/menu/combo";
import { cartItemKey } from "@/features/menu/utils/cart";

interface Props {
  cart: CartItem[];
  combos: WaiterComboCartLine[];
  totalItems: number;
  totalPrice: number;
  isAddingToExisting: boolean;
  onUpdateQty: (key: string, delta: number) => void;
  onUpdateComboQty: (key: string, delta: number) => void;
  onEditItem: (key: string) => void;
  onReview: () => void;
}

const QuantityControl = ({
  quantity,
  onDecrease,
  onIncrease,
}: {
  quantity: number;
  onDecrease: () => void;
  onIncrease: () => void;
}) => (
  <span className="flex shrink-0 items-center gap-1 rounded-xl bg-surface-secondary p-1">
    <button
      type="button"
      onClick={onDecrease}
      aria-label="Decrease quantity"
      className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-surface"
    >
      <Minus className="h-4 w-4" />
    </button>
    <span className="w-5 text-center text-sm font-semibold">{quantity}</span>
    <button
      type="button"
      onClick={onIncrease}
      aria-label="Increase quantity"
      className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"
    >
      <Plus className="h-4 w-4" />
    </button>
  </span>
);

export const TabletOrderRail = ({
  cart,
  combos,
  totalItems,
  totalPrice,
  isAddingToExisting,
  onUpdateQty,
  onUpdateComboQty,
  onEditItem,
  onReview,
}: Props) => (
  <aside className="hidden min-h-0 flex-col border-l border-border bg-surface md:flex">
    <div className="border-b border-divider px-5 py-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-base font-semibold text-text-primary">
            Current order
          </p>
          <p className="text-xs text-text-secondary">
            {totalItems
              ? `${totalItems} ${totalItems === 1 ? "item" : "items"}`
              : "Nothing added yet"}
          </p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-surface text-primary">
          <ShoppingBag className="h-5 w-5" />
        </span>
      </div>
    </div>

    <div className="flex-1 overflow-y-auto px-4 py-3">
      {!totalItems ? (
        <div className="flex h-full min-h-48 flex-col items-center justify-center text-center">
          <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-secondary text-text-disabled">
            <ShoppingBag className="h-6 w-6" />
          </span>
          <p className="text-sm font-medium text-text-primary">
            Your order is empty
          </p>
          <p className="mt-1 max-w-48 text-xs text-text-secondary">
            Tap a menu item to add it here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {cart.map((item) => {
            const key = cartItemKey(item);
            return (
              <div
                key={key}
                className="rounded-2xl border border-border bg-background p-3"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {item.name}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {item.variantName ? `${item.variantName} · ` : ""}₹
                      {item.unitPrice.toFixed(2)} each
                    </p>
                  </div>
                  <strong className="shrink-0 text-sm font-semibold text-text-primary">
                    ₹{(item.unitPrice * item.quantity).toFixed(2)}
                  </strong>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <QuantityControl
                    quantity={item.quantity}
                    onDecrease={() => onUpdateQty(key, -1)}
                    onIncrease={() => onUpdateQty(key, 1)}
                  />
                  <button
                    type="button"
                    onClick={() => onEditItem(key)}
                    className="flex min-h-9 items-center gap-1.5 rounded-lg bg-primary-surface px-2.5 text-xs font-semibold text-primary"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                </div>
              </div>
            );
          })}
          {combos.map((line) => {
            const key = comboLineKey(line);
            return (
              <div
                key={key}
                className="rounded-2xl border border-border bg-background p-3"
              >
                <p className="mb-2 truncate text-sm font-medium text-text-primary">
                  {line.combo.name}
                </p>
                <QuantityControl
                  quantity={line.quantity}
                  onDecrease={() => onUpdateComboQty(key, -1)}
                  onIncrease={() => onUpdateComboQty(key, 1)}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>

    <div className="border-t border-divider p-4">
      <div className="mb-3 flex items-end justify-between">
        <span className="text-sm text-text-secondary">Estimated total</span>
        <strong className="text-xl font-semibold text-text-primary">
          ₹{totalPrice.toFixed(2)}
        </strong>
      </div>
      <button
        type="button"
        onClick={onReview}
        disabled={!totalItems}
        className="flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isAddingToExisting ? "Review additions" : "Review order"} →
      </button>
    </div>
  </aside>
);
