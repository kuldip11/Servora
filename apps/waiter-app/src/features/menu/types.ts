export interface SelectedModifier {
  optionId: string;
  groupId: string;
  groupName: string;
  name: string;
  price: number;
  quantity: number;
  zoneLabel?: string;
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
  seatLabel?: string;
  course?: number;
  weightQuantity?: number;
  weightUnit?: "G" | "KG" | "LB" | "OZ" | null;
  manualPrice?: number;
  unitPrice: number;
}
