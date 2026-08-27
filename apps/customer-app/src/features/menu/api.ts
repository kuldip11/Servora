import { request } from "../../shared/api/client";

export type CustomerMenuItem = {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  basePrice: string;
  taxRate: string;
  imageUrl: string | null;
  foodType: "VEG" | "NON_VEG" | "EGG";
  spiceLevel: "NONE" | "MILD" | "MEDIUM" | "HOT" | null;
  prepTimeMinutes: number | null;
  variants: Array<{ id: string; name: string; price: string }>;
  modifierGroupLinks: Array<{
    sortOrder: number;
    group: {
      id: string;
      name: string;
      selectionType: "SINGLE" | "MULTIPLE";
      minSelections: number;
      maxSelections: number | null;
      options: Array<{ id: string; name: string; additionalPrice: string; isAvailable: boolean; maxQuantity: number }>; 
    };
  }>;
  tagLinks: Array<{ tag: { name: string } }>;
  images: Array<{ url: string; sortOrder: number }>;
};

export type CustomerMenu = {
  restaurant: { id: string; name: string; address: string };
  mode: "DINE_IN" | "TAKEAWAY";
  table: { id: string; name: string; section: string | null } | null;
  categories: Array<{ id: string; name: string; sortOrder: number }>;
  items: CustomerMenuItem[];
};

export function getCustomerMenu(sessionToken: string) {
  return request<CustomerMenu>("/api/customer/menu", undefined, sessionToken);
}
