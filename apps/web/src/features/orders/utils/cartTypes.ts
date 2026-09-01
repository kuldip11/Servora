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
  seatLabel?: string;
  courseNumber?: number;
  unitPrice: number;
}

export const cartItemKey = (item: CartItem): string => {
  return `${item.menuItemId}__${item.variantId ?? ""}__${item.seatLabel ?? ""}__${item.modifiers
    .map((m) => `${m.optionId}x${m.quantity}`)
    .sort()
    .join(",")}`;
};
