import { memo } from "react";
import { Plus, Minus } from "lucide-react";
import { Card } from "@pos/ui";
import type { CartItem } from "@/features/menu/types";
import { priceLabel } from "@/features/menu/utils/cart";
import { FOOD_TYPE_DOT_CLASSES } from "@/features/menu/constants";
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
      className="group relative flex min-h-[128px] flex-col overflow-hidden rounded-2xl border-border p-3 transition-shadow hover:shadow-md"
    >
      {cartQty > 0 && (
        <span className="absolute right-2 top-2 z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground">
          {cartQty}
        </span>
      )}

      <div className="flex min-w-0 items-start gap-2.5">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt=""
            loading="lazy"
            className="h-12 w-12 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-surface text-lg font-semibold text-primary">
            {item.name.charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1 pr-2">
          <div className="mb-1 flex items-start gap-1.5">
            <span
              className={`mt-1 flex h-3 w-3 shrink-0 items-center justify-center rounded-sm border ${foodTypeClasses.border}`}
              aria-label={item.foodType?.replace("_", " ") ?? "Vegetarian"}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${foodTypeClasses.fill}`}
              />
            </span>
            <p className="line-clamp-2 text-sm font-semibold leading-[18px] text-text-primary">
              {item.name}
            </p>
          </div>
          {item.description && (
            <p className="line-clamp-1 text-[11px] text-text-secondary">
              {item.description}
            </p>
          )}
        </div>
      </div>

      <div className="mt-2 flex flex-1 items-end">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          {item.prepTimeMinutes != null && item.prepTimeMinutes > 0 && (
            <p className="text-[11px] text-text-disabled">
              ~{item.prepTimeMinutes}m
            </p>
          )}
          {hasOptions && (
            <p className="text-[11px] font-medium text-primary">Customisable</p>
          )}
          {item.manualStockCount != null && item.manualStockCount <= 5 && (
            <p className="text-[11px] font-semibold text-warning">
              {item.manualStockCount} left
            </p>
          )}
        </div>
      </div>
      <div className="mt-2 flex min-h-10 items-center justify-between gap-2 border-t border-divider pt-2">
        <span className="min-w-0 truncate text-sm font-semibold text-text-primary">
          {priceLabel(item)}
        </span>
        {singleCart ? (
          <span className="flex shrink-0 items-center gap-1 rounded-xl bg-surface-secondary p-1">
            <button
              onClick={() => onQtyChange(-1)}
              aria-label={`Decrease quantity of ${item.name}`}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary"
            >
              <Minus className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="w-5 text-center text-sm font-bold">
              {singleCart.quantity}
            </span>
            <button
              onClick={onTap}
              aria-label={`Increase quantity of ${item.name}`}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
          </span>
        ) : (
          <button
            onClick={onTap}
            aria-label={`Add ${item.name} to order`}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform active:scale-95"
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>
    </Card>
  );
});
