// Shared between CreateOrderModal and AddItemsModal — both need the same
// "pick an item, optionally customise it, add to cart" flow that the waiter
// app already has (see ItemCustomiser.tsx there). This used to be missing
// entirely from the web app: clicking an item just added it at base price
// with no variant/modifier picker at all.

export interface SelectedModifier {
  optionId: string;
  groupId: string;
  groupName: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CartItem {
  menuItemId: string;
  menuItemName: string;
  basePrice: number;
  variantId?: string;
  variantName?: string;
  modifiers: SelectedModifier[];
  quantity: number;
  chefNotes: string;
  unitPrice: number;
}

// Two cart lines are "the same" (and should stack quantity instead of
// creating a new line) only if item + variant + exact modifier selection
// all match.
export function cartItemKey(item: CartItem): string {
  return `${item.menuItemId}__${item.variantId ?? ""}__${item.modifiers
    .map((m) => `${m.optionId}x${m.quantity}`)
    .sort()
    .join(",")}`;
}
