import { beforeEach, describe, expect, it } from "vitest";
import { clearPersistedCart, getCustomerStorageScope, loadPersistedCart, restoreCart, savePersistedCart } from "./persistence";
import type { CartLine } from "./pricing";
import type { CustomerMenuItem } from "../menu/api";

const item: CustomerMenuItem = {
  id: "item-1",
  categoryId: "cat-1",
  name: "Biryani",
  description: null,
  basePrice: "200",
  taxRate: "5",
  imageUrl: null,
  foodType: "NON_VEG",
  spiceLevel: "MEDIUM",
  prepTimeMinutes: 20,
  variants: [{ id: "variant-1", name: "Regular", price: "200" }],
  modifierGroupLinks: [{ sortOrder: 0, group: { id: "group-1", name: "Extras", selectionType: "MULTIPLE", minSelections: 0, maxSelections: 2, options: [{ id: "option-1", name: "Raita", additionalPrice: "30", isAvailable: true, maxQuantity: 2 }] } }],
  tagLinks: [],
  images: [],
};

describe("customer cart persistence", () => {
  beforeEach(() => localStorage.clear());

  it("scopes storage to the QR token", () => {
    expect(getCustomerStorageScope("abc", false)).toBe("qr:abc");
    expect(getCustomerStorageScope("xyz", false)).not.toBe(getCustomerStorageScope("abc", false));
    expect(getCustomerStorageScope(null, true)).toBe("demo");
  });

  it("persists only the cart references needed for safe restoration", () => {
    const scope = "qr:abc";
    const cart: CartLine[] = [{ item, quantity: 2, variantId: "variant-1", selectedOptions: [{ optionId: "option-1", quantity: 1 }], fulfillmentType: "DINE_IN" }];
    savePersistedCart(scope, cart);
    expect(loadPersistedCart(scope)).toEqual([{ itemId: "item-1", quantity: 2, variantId: "variant-1", selectedOptions: [{ optionId: "option-1", quantity: 1 }], fulfillmentType: "DINE_IN" }]);
  });

  it("rebuilds cart lines from the current server menu", () => {
    const scope = "qr:abc";
    savePersistedCart(scope, [{ item, quantity: 2, variantId: "variant-1", selectedOptions: [{ optionId: "option-1", quantity: 1 }], fulfillmentType: "DINE_IN" }]);
    const restored = restoreCart(scope, [item], "DINE_IN");
    expect(restored.droppedCount).toBe(0);
    expect(restored.cart[0]?.item).toBe(item);
    expect(restored.cart[0]?.quantity).toBe(2);
  });

  it("drops items that are no longer in the menu", () => {
    const scope = "qr:abc";
    savePersistedCart(scope, [{ item, quantity: 1, selectedOptions: [], fulfillmentType: "DINE_IN" }]);
    const restored = restoreCart(scope, [], "DINE_IN");
    expect(restored.cart).toEqual([]);
    expect(restored.droppedCount).toBe(1);
  });

  it("forces takeaway fulfillment for a public takeaway session", () => {
    const scope = "qr:takeaway";
    savePersistedCart(scope, [{ item, quantity: 1, selectedOptions: [], fulfillmentType: "DINE_IN" }]);
    const restored = restoreCart(scope, [item], "TAKEAWAY");
    expect(restored.cart[0]?.fulfillmentType).toBe("TAKEAWAY");
  });

  it("can clear the persisted cart after successful submission", () => {
    const scope = "qr:abc";
    savePersistedCart(scope, [{ item, quantity: 1, selectedOptions: [], fulfillmentType: "DINE_IN" }]);
    clearPersistedCart(scope);
    expect(loadPersistedCart(scope)).toEqual([]);
  });
});
