import type { CartItem } from '../types';

// Item's real price is either a flat base price, or — once it has variants
// — a range across those (absolute) variant prices. Showing a flat base
// price when the price is actually variant-driven is misleading.
export function priceLabel(item: any): string {
  if (!item.variants?.length) return `₹${parseFloat(item.basePrice).toFixed(2)}`;
  const prices = item.variants.map((v: any) => parseFloat(v.price));
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? `₹${min.toFixed(2)}` : `₹${min.toFixed(2)}–₹${max.toFixed(2)}`;
}

export function cartItemKey(item: CartItem) {
  return `${item.menuItemId}__${item.variantId ?? ''}__${item.modifiers.map((m) => `${m.optionId}x${m.quantity}`).sort().join(',')}`;
}
