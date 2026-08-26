import { describe, expect, it } from "vitest";
import { resolveItems } from "../order-pricing";

const menu = (overrides: any = {}) => ({
  id: "m1",
  name: "Pizza",
  isAvailable: true,
  basePrice: "100.00",
  taxRate: "5",
  variants: [],
  modifierGroupLinks: [],
  ...overrides,
});

describe("resolveItems", () => {
  it("resolves base pricing and tax", () => {
    const result = resolveItems(
      [{ menuItemId: "m1", quantity: 2 }],
      new Map([["m1", menu()]]),
    );
    expect(result.resolved[0]!).toMatchObject({
      unitPrice: 100,
      subtotal: 200,
      quantity: 2,
    });
    expect(result).toMatchObject({ subtotal: 200, taxAmount: 10 });
  });
  it("uses variant price instead of base price and adds modifier prices", () => {
    const item = menu({
      variants: [{ id: "v1", name: "Large", price: "150" }],
      modifierGroupLinks: [
        {
          group: {
            id: "g1",
            name: "Extras",
            minSelections: 0,
            maxSelections: 2,
            selectionType: "MULTIPLE",
            options: [
              {
                id: "o1",
                name: "Cheese",
                isAvailable: true,
                maxQuantity: 2,
                additionalPrice: "20",
              },
            ],
          },
        },
      ],
    });
    const result = resolveItems(
      [
        {
          menuItemId: "m1",
          variantId: "v1",
          quantity: 2,
          selectedOptions: [{ optionId: "o1", quantity: 3 }],
        },
      ],
      new Map([["m1", item]]),
    );
    expect(result.resolved[0]!).toMatchObject({
      variantName: "Large",
      unitPrice: 190,
      subtotal: 380,
    });
    expect(result.resolved[0]!.modifiers[0]!).toMatchObject({
      quantity: 2,
      price: 20,
    });
  });
  it("rejects missing/unavailable menu items and variants/options", () => {
    expect(() =>
      resolveItems([{ menuItemId: "missing", quantity: 1 }], new Map()),
    ).toThrow("not found");
    expect(() =>
      resolveItems(
        [{ menuItemId: "m1", quantity: 1 }],
        new Map([["m1", menu({ isAvailable: false })]]),
      ),
    ).toThrow("not available");
    expect(() =>
      resolveItems(
        [{ menuItemId: "m1", variantId: "bad", quantity: 1 }],
        new Map([["m1", menu({ variants: [] })]]),
      ),
    ).toThrow("Variant not found");
  });
  it("enforces modifier availability and group selection rules", () => {
    const item = menu({
      modifierGroupLinks: [
        {
          group: {
            id: "g1",
            name: "Size",
            minSelections: 1,
            maxSelections: 1,
            selectionType: "SINGLE",
            options: [
              {
                id: "o1",
                name: "A",
                isAvailable: true,
                maxQuantity: 1,
                additionalPrice: "0",
              },
              {
                id: "o2",
                name: "B",
                isAvailable: false,
                maxQuantity: 1,
                additionalPrice: "0",
              },
            ],
          },
        },
      ],
    });
    expect(() =>
      resolveItems(
        [{ menuItemId: "m1", quantity: 1 }],
        new Map([["m1", item]]),
      ),
    ).toThrow("requires at least");
    expect(() =>
      resolveItems(
        [
          {
            menuItemId: "m1",
            quantity: 1,
            selectedOptions: [{ optionId: "o1" }, { optionId: "o2" }],
          },
        ],
        new Map([["m1", item]]),
      ),
    ).toThrow("currently unavailable");
    const two = {
      ...item,
      modifierGroupLinks: [
        {
          group: {
            ...item.modifierGroupLinks[0].group,
            maxSelections: 2,
            selectionType: "MULTIPLE",
          },
        },
      ],
    };
    expect(() =>
      resolveItems(
        [
          {
            menuItemId: "m1",
            quantity: 1,
            selectedOptions: [
              { optionId: "o1" },
              { optionId: "o1" },
              { optionId: "o1" },
            ],
          },
        ],
        new Map([["m1", two]]),
      ),
    ).toThrow("allows at most 2");
  });
});
