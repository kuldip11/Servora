import { memo, useCallback } from "react";
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
  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 pb-28">
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
        items.map((item) => {
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
        })
      )}
    </div>
  );
};
