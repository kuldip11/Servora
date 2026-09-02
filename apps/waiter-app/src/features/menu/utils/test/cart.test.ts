import { describe, expect, it } from "vitest";
import type { OrderableMenuItem, OrderableMenuVariant } from "@pos/types";
import type { CartItem } from "@/features/menu/types";
import {
  cartItemKey,
  priceLabel,
  replaceCartItem,
} from "@/features/menu/utils/cart";

const menuItem = (
  overrides: Partial<OrderableMenuItem> = {},
): OrderableMenuItem => {
  return {
    id: "m1",
    name: "Item",
    basePrice: "12.5",
    variants: [],
    modifierGroupLinks: [],
    ...overrides,
  };
};

const variant = (id: string, price: string): OrderableMenuVariant => {
  return { id, name: `Variant ${id}`, price };
};

describe("cart helpers", () => {
  it("formats flat and variant-driven prices", () => {
    expect(priceLabel(menuItem({ basePrice: "12.5" }))).toBe("₹12.50");
    expect(
      priceLabel(
        menuItem({
          basePrice: "0",
          variants: [variant("v1", "10"), variant("v2", "10")],
        }),
      ),
    ).toBe("₹10.00");
    expect(
      priceLabel(
        menuItem({
          basePrice: "0",
          variants: [variant("v1", "10"), variant("v2", "15")],
        }),
      ),
    ).toBe("₹10.00–₹15.00");
  });

  it("builds a stable key independent of modifier ordering", () => {
    const a: CartItem = {
      menuItemId: "m1",
      name: "Item",
      basePrice: 10,
      variantId: "v1",
      modifiers: [
        {
          optionId: "b",
          groupId: "g",
          groupName: "Group",
          name: "B",
          price: 0,
          quantity: 2,
        },
        {
          optionId: "a",
          groupId: "g",
          groupName: "Group",
          name: "A",
          price: 0,
          quantity: 1,
        },
      ],
      quantity: 1,
      chefNotes: "",
      unitPrice: 10,
    };
    const b: CartItem = { ...a, modifiers: [a.modifiers[1]!, a.modifiers[0]!] };
    expect(cartItemKey(a)).toBe(cartItemKey(b));
  });

  it("replaces an edited configuration and merges matching cart lines", () => {
    const small: CartItem = {
      menuItemId: "m1",
      name: "Item",
      basePrice: 10,
      variantId: "small",
      variantName: "Small",
      modifiers: [],
      quantity: 1,
      chefNotes: "",
      unitPrice: 10,
    };
    const large: CartItem = {
      ...small,
      variantId: "large",
      variantName: "Large",
      quantity: 2,
      unitPrice: 15,
    };

    const replaced = replaceCartItem([small], cartItemKey(small), large);
    expect(replaced).toEqual([large]);

    const merged = replaceCartItem(
      [small, { ...large, quantity: 1 }],
      cartItemKey(small),
      large,
    );
    expect(merged).toHaveLength(1);
    expect(merged[0]?.quantity).toBe(3);
  });
});
