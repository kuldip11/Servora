import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Spinner } from "@pos/ui";
import type { CartItem } from "@/features/menu/types";
import { cartItemKey } from "@/features/menu/utils/cart";
import { MenuItemCard } from "./MenuItemCard";
import type { OrderableMenuItem } from "@pos/types";

interface Props {
  items: OrderableMenuItem[];
  cart: CartItem[];
  isLoading: boolean;
  menuSearch: string;
  onItemTap: (item: OrderableMenuItem) => void;
  onQtyChange: (key: string, delta: number) => void;
}

const MenuGridItem = memo(function MenuGridItem({
  item,
  cartQty,
  singleCart,
  onItemTap,
  onQtyChange,
}: {
  item: OrderableMenuItem;
  cartQty: number;
  singleCart: CartItem | false | undefined;
  onItemTap: (item: OrderableMenuItem) => void;
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

export const MenuGrid = ({
  items,
  cart,
  isLoading,
  menuSearch,
  onItemTap,
  onQtyChange,
}: Props) => {
  const [visibleCount, setVisibleCount] = useState(24);
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => setVisibleCount(24), [items, menuSearch]);
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || visibleCount >= items.length) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting)
          setVisibleCount((current) => Math.min(items.length, current + 24));
      },
      { rootMargin: "300px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [items.length, visibleCount]);
  const visibleItems = items.slice(0, visibleCount);
  return (
    <div className="scrollbar-hidden flex-1 overflow-y-auto px-3.5 pb-28 pt-2.5">
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="w-6 h-6" />
        </div>
      ) : !items.length ? (
        <p className="text-center text-text-disabled py-12 text-sm">
          {menuSearch
            ? "No items match your search"
            : "No items in this category"}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3 xl:grid-cols-4">
          {visibleItems.map((item) => {
            const cartQty = cart
              .filter((c) => c.menuItemId === item.id)
              .reduce((s, c) => s + c.quantity, 0);
            const hasOptions =
              item.variants?.length > 0 || item.modifierGroupLinks?.length > 0;
            const singleCart =
              !hasOptions && cart.find((c) => c.menuItemId === item.id);
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
      )}
      {visibleCount < items.length && (
        <div
          ref={sentinelRef}
          className="py-5 text-center text-xs text-text-secondary"
        >
          Loading more menu items…
        </div>
      )}
    </div>
  );
};
