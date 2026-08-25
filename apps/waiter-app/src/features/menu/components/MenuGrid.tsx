import { memo, useCallback } from 'react';
import { Spinner } from '@pos/ui';
import type { CartItem } from '../types';
import { cartItemKey } from '../utils/cart';
import { MenuItemCard } from './MenuItemCard';

interface Props {
  items: any[];
  cart: CartItem[];
  isLoading: boolean;
  menuSearch: string;
  onItemTap: (item: any) => void;
  onQtyChange: (key: string, delta: number) => void;
}

// Phase 14 (perf pass, follow-up): this used to build `onTap`/
// `onQtyChange` as fresh inline arrows per item, directly on
// `MenuItemCard`, on every render — that's exactly the pattern that
// defeats a memoized child, so `MenuItemCard`'s new `React.memo`
// wrapper needed this file's cooperation, not just its own change.
// `useCallback` can't be called inside `.map()`, so the per-item
// callback stabilization moved into its own small component
// (`MenuGridItem`) instead — one hook call per rendered item, at the
// component level, not inside a loop. `item`/`singleCart` are only
// referentially stable across an unrelated re-render if `items`/`cart`
// themselves are (e.g. an unchanged query-cache reference); when the
// cart or item list genuinely changes, `useCallback`'s dependency
// array still picks that up correctly — this isn't claiming those
// renders are free, just that renders unrelated to this item's own
// data no longer are.
const MenuGridItem = memo(function MenuGridItem({
  item,
  cartQty,
  singleCart,
  onItemTap,
  onQtyChange,
}: {
  item: any;
  cartQty: number;
  singleCart: CartItem | false | undefined;
  onItemTap: (item: any) => void;
  onQtyChange: (key: string, delta: number) => void;
}) {
  const handleTap = useCallback(() => onItemTap(item), [onItemTap, item]);
  const handleQtyChange = useCallback(
    (delta: number) => {
      if (singleCart) onQtyChange(cartItemKey(singleCart), delta);
    },
    [onQtyChange, singleCart],
  );

  return (
    <MenuItemCard
      item={item}
      cartQty={cartQty}
      singleCart={singleCart}
      onTap={handleTap}
      onQtyChange={handleQtyChange}
    />
  );
});

export function MenuGrid({ items, cart, isLoading, menuSearch, onItemTap, onQtyChange }: Props) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 pb-28">
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="w-6 h-6" />
        </div>
      ) : !items.length ? (
        <p className="text-center text-text-disabled py-12 text-sm">
          {menuSearch ? 'No items match your search' : 'No items in this category'}
        </p>
      ) : items.map((item: any) => {
        const cartQty    = cart.filter((c) => c.menuItemId === item.id).reduce((s, c) => s + c.quantity, 0);
        const hasOptions = item.variants?.length > 0 || item.modifierGroupLinks?.length > 0;
        const singleCart = !hasOptions && cart.find((c) => c.menuItemId === item.id);
        return (
          <MenuGridItem
            key={item.id}
            item={item}
            cartQty={cartQty}
            singleCart={singleCart}
            onItemTap={onItemTap}
            onQtyChange={onQtyChange}
          />
        );
      })}
    </div>
  );
}
