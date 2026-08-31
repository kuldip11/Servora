import { describe, expect, it } from "vitest";
import { cartItemKey, type CartItem } from "../cartTypes";

const item = (overrides: Partial<CartItem> = {}): CartItem => ({
  menuItemId: "item-1",
  menuItemName: "Paneer Tikka",
  basePrice: 250,
  modifiers: [],
  quantity: 1,
  chefNotes: "",
  unitPrice: 250,
  ...overrides,
});

describe("cartItemKey", () => {
  it("groups identical item and modifier selections", () => {
    expect(
      cartItemKey(
        item({
          modifiers: [
            {
              optionId: "m2",
              groupId: "g",
              groupName: "Extras",
              name: "Cheese",
              price: 20,
              quantity: 1,
            },
            {
              optionId: "m1",
              groupId: "g",
              groupName: "Extras",
              name: "Sauce",
              price: 10,
              quantity: 2,
            },
          ],
        }),
      ),
    ).toBe("item-1______m1x2,m2x1");
  });

  it("is independent of modifier ordering", () => {
    const a = item({
      modifiers: [
        {
          optionId: "m1",
          groupId: "g",
          groupName: "Extras",
          name: "Sauce",
          price: 10,
          quantity: 1,
        },
        {
          optionId: "m2",
          groupId: "g",
          groupName: "Extras",
          name: "Cheese",
          price: 20,
          quantity: 1,
        },
      ],
    });
    const b = item({
      modifiers: [...a.modifiers].reverse(),
    });
    expect(cartItemKey(a)).toBe(cartItemKey(b));
  });

  it("distinguishes variants and modifier quantities", () => {
    expect(cartItemKey(item({ variantId: "small" }))).not.toBe(
      cartItemKey(item({ variantId: "large" })),
    );
    expect(
      cartItemKey(
        item({
          modifiers: [
            {
              optionId: "m1",
              groupId: "g",
              groupName: "Extras",
              name: "Sauce",
              price: 10,
              quantity: 1,
            },
          ],
        }),
      ),
    ).not.toBe(
      cartItemKey(
        item({
          modifiers: [
            {
              optionId: "m1",
              groupId: "g",
              groupName: "Extras",
              name: "Sauce",
              price: 10,
              quantity: 2,
            },
          ],
        }),
      ),
    );
  });

  it("keeps identical dishes for different seats as separate lines", () => {
    expect(cartItemKey(item({ seatLabel: "Seat 1" }))).not.toBe(
      cartItemKey(item({ seatLabel: "Seat 2" })),
    );
  });
});
