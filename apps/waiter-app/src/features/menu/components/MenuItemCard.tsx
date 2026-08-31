import { memo } from "react";
import { Plus, Minus } from "lucide-react";
import { Card } from "@pos/ui";
import type { CartItem } from "../types";
import { FOOD_TYPE_DOT_CLASSES } from "../constants";
import { priceLabel } from "../utils/cart";
import type { OrderableMenuItem } from "@pos/types";

interface Props {
  item: OrderableMenuItem;
  cartQty: number;
  singleCart: CartItem | false | undefined;
  onTap: () => void;
  onQtyChange: (delta: number) => void;
}

// Memoized menu card used by the waiter order-entry grid.
export const MenuItemCard = memo(function MenuItemCard({
  item,
  cartQty,
  singleCart,
  onTap,
  onQtyChange,
}: Props) {
  const hasOptions =
    item.variants?.length > 0 || item.modifierGroupLinks?.length > 0 ||
    item.supportsZones === true || item.pricingMode === "WEIGHT_BASED" || item.pricingMode === "OPEN";
  const foodTypeClasses =
    FOOD_TYPE_DOT_CLASSES[
      item.foodType as keyof typeof FOOD_TYPE_DOT_CLASSES
    ] ?? FOOD_TYPE_DOT_CLASSES.VEG;

  return (
    <Card padding="sm" className="rounded-2xl flex items-center gap-3">
      <div
        className={`w-3 h-3 rounded-sm border-2 flex-shrink-0 ${foodTypeClasses.border}`}
      >
        <div
          className={`w-1.5 h-1.5 rounded-full m-auto mt-px ${foodTypeClasses.fill}`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary truncate">
          {item.name}
        </p>
        {item.description && (
          <p className="text-xs text-text-disabled mt-0.5 line-clamp-1">
            {item.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <p className="text-sm font-bold text-primary">{priceLabel(item)}</p>
          {item.prepTimeMinutes != null && item.prepTimeMinutes > 0 && (
            <p className="text-xs text-text-disabled">
              ~{item.prepTimeMinutes}m
            </p>
          )}
          {hasOptions && (
            <p className="text-xs text-text-disabled">Options ▾</p>
          )}
          {item.manualStockCount != null && item.manualStockCount <= 5 && (
            <p className="text-xs font-semibold text-warning">{item.manualStockCount} left</p>
          )}
        </div>
      </div>
      <div className="flex-shrink-0">
        {singleCart ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onQtyChange(-1)}
              aria-label={`Decrease quantity of ${item.name}`}
              className="w-8 h-8 flex items-center justify-center bg-surface-secondary rounded-full"
            >
              <Minus
                className="w-4 h-4 text-text-secondary"
                aria-hidden="true"
              />
            </button>
            <span className="text-sm font-bold w-5 text-center">
              {singleCart.quantity}
            </span>
            <button
              onClick={onTap}
              aria-label={`Increase quantity of ${item.name}`}
              className="w-8 h-8 flex items-center justify-center bg-primary rounded-full"
            >
              <Plus
                className="w-4 h-4 text-primary-foreground"
                aria-hidden="true"
              />
            </button>
          </div>
        ) : (
          <button
            onClick={onTap}
            aria-label={`Add ${item.name} to order`}
            className="relative w-9 h-9 flex items-center justify-center bg-primary rounded-full"
          >
            <Plus
              className="w-5 h-5 text-primary-foreground"
              aria-hidden="true"
            />
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
