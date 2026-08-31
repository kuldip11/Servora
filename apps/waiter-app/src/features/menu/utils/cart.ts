import type { CartItem } from "../types";

// Item's real price is either a flat base price, or — once it has variants
// — a range across those (absolute) variant prices. Showing a flat base
// price when the price is actually variant-driven is misleading.
export function priceLabel(item: any): string {
  if (item.pricingMode === "OPEN") return "Open price";
  if (item.pricingMode === "WEIGHT_BASED") return `₹${parseFloat(item.basePrice).toFixed(2)}/${String(item.weightUnit ?? "unit").toLowerCase()}`;
  if (!item.variants?.length)
    return `₹${parseFloat(item.basePrice).toFixed(2)}`;
  const prices = item.variants.map((v: any) => parseFloat(v.price));
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max
    ? `₹${min.toFixed(2)}`
    : `₹${min.toFixed(2)}–₹${max.toFixed(2)}`;
}

export function cartItemKey(item: CartItem) {
  return `${item.menuItemId}__${item.variantId ?? ""}__weight${item.weightQuantity ?? ""}__manual${item.manualPrice ?? ""}__course${item.course ?? "none"}__${item.modifiers
    .map((m) => `${m.optionId}:${m.zoneLabel ?? "WHOLE"}x${m.quantity}`)
    .sort()
    .join(",")}`;
}
