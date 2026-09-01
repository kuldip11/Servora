import type { OrderableMenuItem } from "@pos/types";
import type { CartItem } from "@/features/menu/types";

export const priceLabel = (item: OrderableMenuItem): string => {
  if (item.pricingMode === "OPEN") return "Open price";
  if (item.pricingMode === "WEIGHT_BASED")
    return `₹${Number(item.basePrice).toFixed(2)}/${String(item.weightUnit ?? "unit").toLowerCase()}`;
  if (!item.variants?.length) return `₹${Number(item.basePrice).toFixed(2)}`;
  const prices = item.variants.map((v) => Number(v.price));
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max
    ? `₹${min.toFixed(2)}`
    : `₹${min.toFixed(2)}–₹${max.toFixed(2)}`;
};

export const cartItemKey = (item: CartItem) => {
  return `${item.menuItemId}__${item.variantId ?? ""}__weight${item.weightQuantity ?? ""}__manual${item.manualPrice ?? ""}__course${item.course ?? "none"}__${item.modifiers
    .map((m) => `${m.optionId}:${m.zoneLabel ?? "WHOLE"}x${m.quantity}`)
    .sort()
    .join(",")}`;
};
