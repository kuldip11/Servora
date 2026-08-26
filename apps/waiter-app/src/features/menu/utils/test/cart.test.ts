import { describe, expect, it } from "vitest";
import { cartItemKey, priceLabel } from "../cart";

describe("cart helpers", () => {
  it("formats flat and variant-driven prices", () => {
    expect(priceLabel({ basePrice: "12.5" })).toBe("₹12.50");
    expect(
      priceLabel({
        basePrice: "0",
        variants: [{ price: "10" }, { price: "10" }],
      }),
    ).toBe("₹10.00");
    expect(
      priceLabel({
        basePrice: "0",
        variants: [{ price: "10" }, { price: "15" }],
      }),
    ).toBe("₹10.00–₹15.00");
  });

  it("builds a stable key independent of modifier ordering", () => {
    const a = {
      menuItemId: "m1",
      variantId: "v1",
      modifiers: [
        { optionId: "b", quantity: 2 },
        { optionId: "a", quantity: 1 },
      ],
    };
    const b = { ...a, modifiers: [a.modifiers[1], a.modifiers[0]] };
    expect(cartItemKey(a as any)).toBe(cartItemKey(b as any));
  });
});
