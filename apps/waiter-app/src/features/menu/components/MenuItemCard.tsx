import { memo } from 'react';
import { Plus, Minus } from 'lucide-react';
import { Card } from '@pos/ui';
import type { CartItem } from '../types';
import { FOOD_TYPE_DOT_CLASSES } from '../constants';
import { priceLabel } from '../utils/cart';

interface Props {
  item: any;
  cartQty: number;
  singleCart: CartItem | false | undefined;
  onTap: () => void;
  onQtyChange: (delta: number) => void;
}

// Design-system Phase 11, Sprint WA-3 — rebuilt on `Card` (Phase 2),
// same `rounded-2xl` `className` override as `OrderCard`/`HomePage`
// (Sprint WA-1), for the same reason: `Card` has no `radius` prop and
// this app's cards are a step rounder than Admin's by design.
//
// `FOOD_TYPE_DOT_CLASSES` (`../constants.ts`) is **untouched** — the
// emerald/red/amber veg/non-veg/egg dot is the same fixed
// packaging-convention color scheme `apps/web`'s `FoodTypeDot`
// component already hardcodes (checked directly — that Admin component
// isn't tokenized either), not a design-system literal to repoint.
// The cart-count badge's `amber-500`, on the other hand, retokenizes
// to `warning` — that one's this app's own choice of "draws the eye"
// color, not a shared cross-app convention.
//
// **Flagged, not silent:** original padding was `p-3` (12px); `Card`'s
// padding scale only has `sm` (8px, `--spacing-sm`) and `md` (16px,
// `--spacing-md`), no 12px step — `sm` was picked as the closer/
// tighter option, same "no exact token, document the gap" call the
// item grid's `gap-3` got in `MenuPage` (Admin, Sprint AD-9).
// Phase 14 (perf pass, follow-up): wrapped in `React.memo`. Flagged in
// the prior pass alongside `OrderCard` as an unmemoized list card, but
// this one needed more than the wrapper alone — `MenuGrid.tsx` used to
// build a fresh `onTap`/`onQtyChange` arrow per item on every render,
// which would defeat `memo` outright (same "stabilize the callback and
// memo the child together, one without the other doesn't help" lesson
// `KitchenBoard`'s fix already documented). `MenuGrid.tsx` now routes
// through a small `MenuGridItem` wrapper that stabilizes both callbacks
// with `useCallback` before they reach this component.
export const MenuItemCard = memo(function MenuItemCard({ item, cartQty, singleCart, onTap, onQtyChange }: Props) {
  const hasOptions = item.variants?.length > 0 || item.modifierGroupLinks?.length > 0;
  const foodTypeClasses = FOOD_TYPE_DOT_CLASSES[item.foodType as keyof typeof FOOD_TYPE_DOT_CLASSES] ?? FOOD_TYPE_DOT_CLASSES.VEG;

  return (
    <Card padding="sm" className="rounded-2xl flex items-center gap-3">
      <div className={`w-3 h-3 rounded-sm border-2 flex-shrink-0 ${foodTypeClasses.border}`}>
        <div className={`w-1.5 h-1.5 rounded-full m-auto mt-px ${foodTypeClasses.fill}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary truncate">{item.name}</p>
        {item.description && <p className="text-xs text-text-disabled mt-0.5 line-clamp-1">{item.description}</p>}
        <div className="flex items-center gap-2 mt-1">
          <p className="text-sm font-bold text-primary">{priceLabel(item)}</p>
          {item.prepTimeMinutes > 0 && <p className="text-xs text-text-disabled">~{item.prepTimeMinutes}m</p>}
          {hasOptions && <p className="text-xs text-text-disabled">Options ▾</p>}
        </div>
      </div>
      <div className="flex-shrink-0">
        {singleCart ? (
          <div className="flex items-center gap-2">
            <button onClick={() => onQtyChange(-1)}
              aria-label={`Decrease quantity of ${item.name}`}
              className="w-8 h-8 flex items-center justify-center bg-surface-secondary rounded-full">
              <Minus className="w-4 h-4 text-text-secondary" aria-hidden="true" />
            </button>
            <span className="text-sm font-bold w-5 text-center">{singleCart.quantity}</span>
            <button onClick={onTap}
              aria-label={`Increase quantity of ${item.name}`}
              className="w-8 h-8 flex items-center justify-center bg-primary rounded-full">
              <Plus className="w-4 h-4 text-primary-foreground" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <button onClick={onTap}
            aria-label={`Add ${item.name} to order`}
            className="relative w-9 h-9 flex items-center justify-center bg-primary rounded-full">
            <Plus className="w-5 h-5 text-primary-foreground" aria-hidden="true" />
            {cartQty > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-warning rounded-full text-warning-foreground text-xs font-bold flex items-center justify-center">
                {cartQty}
              </span>
            )}
          </button>
        )}
      </div>
    </Card>
  );
});
