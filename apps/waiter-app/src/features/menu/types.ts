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
  name: string;
  basePrice: number;
  variantId?: string;
  variantName?: string;
  modifiers: SelectedModifier[];
  quantity: number;
  chefNotes: string;
  course: 1 | 2 | 3;
  unitPrice: number;
}
