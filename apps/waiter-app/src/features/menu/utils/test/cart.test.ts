import { describe, expect, it } from "vitest";
import type { OrderableMenuItem, OrderableMenuVariant } from "@pos/types";
import type { CartItem } from "../../types";
import { cartItemKey, priceLabel } from "../cart";

function menuItem(overrides: Partial<OrderableMenuItem> = {}): OrderableMenuItem {
  return {
    id: "m1",
    name: "Item",
    basePrice: "12.5",
    variants: [],
    modifierGroupLinks: [],
    ...overrides,
  };
}

function variant(id: string, price: string): OrderableMenuVariant {
  return { id, name: `Variant ${id}`, price };
}

describe("cart helpers", () => {
  it("formats flat and variant-driven prices", () => {
    expect(priceLabel(menuItem({ basePrice: "12.5" }))).toBe("₹12.50");
    expect(
      priceLabel(menuItem({
        basePrice: "0",
        variants: [variant("v1", "10"), variant("v2", "10")],
      })),
    ).toBe("₹10.00");
    expect(
      priceLabel(menuItem({
        basePrice: "0",
        variants: [variant("v1", "10"), variant("v2", "15")],
      })),
    ).toBe("₹10.00–₹15.00");
  });

  it("builds a stable key independent of modifier ordering", () => {
    const a: CartItem = {
      menuItemId: "m1",
      name: "Item",
      basePrice: 10,
      variantId: "v1",
      modifiers: [
        { optionId: "b", groupId: "g", groupName: "Group", name: "B", price: 0, quantity: 2 },
        { optionId: "a", groupId: "g", groupName: "Group", name: "A", price: 0, quantity: 1 },
      ],
      quantity: 1,
      chefNotes: "",
      unitPrice: 10,
    };
    const b: CartItem = { ...a, modifiers: [a.modifiers[1]!, a.modifiers[0]!] };
    expect(cartItemKey(a)).toBe(cartItemKey(b));
  });
});
