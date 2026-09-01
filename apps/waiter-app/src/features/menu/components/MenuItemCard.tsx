import { memo } from "react";
import { Plus, Minus } from "lucide-react";
import { Card } from "@pos/ui";
import type { CartItem } from "@/features/menu/types";
import { FOOD_TYPE_DOT_CLASSES } from "@/features/menu/constants";
import { priceLabel } from "@/features/menu/utils/cart";
import type { OrderableMenuItem } from "@pos/types";

interface Props {
  item: OrderableMenuItem;
  cartQty: number;
  singleCart: CartItem | false | undefined;
  onTap: () => void;
  onQtyChange: (delta: number) => void;
}

export const MenuItemCard = memo(function MenuItemCard({
  item,
  cartQty,
  singleCart,
  onTap,
  onQtyChange,
}: Props) {
  const hasOptions =
    item.variants?.length > 0 ||
    item.modifierGroupLinks?.length > 0 ||
    item.supportsZones === true ||
    item.pricingMode === "WEIGHT_BASED" ||
    item.pricingMode === "OPEN";
  const foodTypeClasses =
    FOOD_TYPE_DOT_CLASSES[
      item.foodType as keyof typeof FOOD_TYPE_DOT_CLASSES
    ] ?? FOOD_TYPE_DOT_CLASSES.VEG;

  return (
    <Card
      padding="sm"
      className="flex min-h-[132px] flex-col rounded-2xl border-border"
    >
      <div className="flex items-start gap-2">
        <div
          className={`mt-0.5 h-3 w-3 shrink-0 rounded-sm border-2 ${foodTypeClasses.border}`}
        >
          <div
            className={`m-auto mt-px h-1.5 w-1.5 rounded-full ${foodTypeClasses.fill}`}
          />
        </div>
        <p className="line-clamp-2 text-sm font-semibold text-text-primary">
          {item.name}
        </p>
      </div>
      <div className="mt-1 min-h-8 flex-1">
        {item.description && (
          <p className="line-clamp-2 text-xs text-text-secondary">
            {item.description}
          </p>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          {item.prepTimeMinutes != null && item.prepTimeMinutes > 0 && (
            <p className="text-xs text-text-disabled">
              ~{item.prepTimeMinutes}m
            </p>
          )}
          {hasOptions && (
            <p className="text-xs text-text-disabled">Options ▾</p>
          )}
          {item.manualStockCount != null && item.manualStockCount <= 5 && (
            <p className="text-xs font-semibold text-warning">
              {item.manualStockCount} left
            </p>
          )}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-primary">{priceLabel(item)}</p>
        {singleCart ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onQtyChange(-1)}
              aria-label={`Decrease quantity of ${item.name}`}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-secondary"
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
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary"
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
            className="relative flex h-10 min-w-16 items-center justify-center gap-1 rounded-xl bg-primary px-2 text-xs font-semibold text-primary-foreground"
          >
            <Plus
              className="w-5 h-5 text-primary-foreground"
              aria-hidden="true"
            />
            Add
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
