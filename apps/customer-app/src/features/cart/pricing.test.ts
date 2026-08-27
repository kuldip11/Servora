import { describe, expect, it } from "vitest";
import {
  getCartLineKey,
  getCartSubtotal,
  getCartSummary,
  getCartTax,
  getCartTotal,
  getLineSubtotal,
} from "./pricing";
import type { CustomerMenuItem } from "../../api";
import type { CartLine } from "./pricing";

const item: CustomerMenuItem = {
  id: "burger",
  categoryId: "main",
  name: "Burger",
  description: "",
  basePrice: "100",
  taxRate: "5",
  imageUrl: null,
  foodType: "NON_VEG",
  spiceLevel: "NONE",
  prepTimeMinutes: 10,
  variants: [{ id: "large", name: "Large", price: "120" }],
  modifierGroupLinks: [
    {
      sortOrder: 0,
      group: {
        id: "extras",
        name: "Extras",
        selectionType: "MULTIPLE",
        minSelections: 0,
        maxSelections: 3,
        options: [
          {
            id: "cheese",
            name: "Cheese",
            additionalPrice: "20",
            isAvailable: true,
            maxQuantity: 2,
          },
        ],
      },
    },
  ],
  tagLinks: [],
  images: [],
};

describe("cart pricing", () => {
  it("includes variants and modifiers in the line subtotal", () => {
    const line: CartLine = {
      item,
      quantity: 2,
      variantId: "large",
      selectedOptions: [{ optionId: "cheese", quantity: 1 }],
      fulfillmentType: "DINE_IN",
    };
    expect(getLineSubtotal(line)).toBe(280);
  });

  it("calculates tax from the complete configured line price", () => {
    const line: CartLine = {
      item,
      quantity: 2,
      variantId: "large",
      selectedOptions: [{ optionId: "cheese", quantity: 1 }],
      fulfillmentType: "DINE_IN",
    };
    expect(getCartSubtotal([line])).toBe(280);
    expect(getCartTax([line])).toBe(14);
    expect(getCartTotal([line])).toBe(294);
  });

  it("creates stable keys independent of option order", () => {
    const first = {
      item,
      variantId: "large",
      selectedOptions: [
        { optionId: "cheese", quantity: 1 },
        { optionId: "sauce", quantity: 1 },
      ],
      fulfillmentType: "DINE_IN",
    } satisfies Pick<
      CartLine,
      "item" | "variantId" | "selectedOptions" | "fulfillmentType"
    >;
    const second = {
      item,
      variantId: "large",
      selectedOptions: [
        { optionId: "sauce", quantity: 1 },
        { optionId: "cheese", quantity: 1 },
      ],
      fulfillmentType: "DINE_IN",
    } satisfies Pick<
      CartLine,
      "item" | "variantId" | "selectedOptions" | "fulfillmentType"
    >;
    expect(getCartLineKey(first)).toBe(getCartLineKey(second));
  });
});

describe("getCartSummary", () => {
  it("derives subtotal, tax, total inputs, and item count in one summary", () => {
    const line = {
      item: {
        id: "item-1",
        categoryId: "main",
        name: "Test item",
        description: null,
        basePrice: "100",
        taxRate: "5",
        imageUrl: null,
        foodType: "VEG" as const,
        spiceLevel: null,
        prepTimeMinutes: 10,
        variants: [{ id: "large", name: "Large", price: "120" }],
        modifierGroupLinks: [
          {
            sortOrder: 0,
            group: {
              id: "extras",
              name: "Extras",
              selectionType: "MULTIPLE" as const,
              minSelections: 0,
              maxSelections: 2,
              options: [
                {
                  id: "cheese",
                  name: "Cheese",
                  additionalPrice: "20",
                  isAvailable: true,
                  maxQuantity: 2,
                },
              ],
            },
          },
        ],
        tagLinks: [],
        images: [],
      },
      quantity: 2,
      variantId: "large",
      selectedOptions: [{ optionId: "cheese", quantity: 1 }],
      fulfillmentType: "DINE_IN",
    } satisfies CartLine;

    expect(getCartSummary([line])).toEqual({
      subtotal: 280,
      tax: 14,
      total: 294,
      itemCount: 2,
    });
  });
});
