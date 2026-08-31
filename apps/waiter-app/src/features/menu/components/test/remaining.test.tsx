import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@pos/ui", () => ({
  BottomSheet: ({ children, footer, title }: any) => (
    <section>
      <h2>{title}</h2>
      {children}
      {footer}
    </section>
  ),
  Button: ({ children, loading: _loading, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
  TextInput: ({ label: _label, ...props }: any) => <input {...props} />,
  SearchInput: (props: any) => <input {...props} />,
}));

import { CartSummary } from "@/features/menu/components/CartSummary";
import { SearchBar } from "@/features/menu/components/SearchBar";
import { ItemCustomiser } from "@/features/menu/components/ItemCustomiser";

const cart: any = [
  {
    menuItemId: "m1",
    name: "Burger",
    basePrice: 100,
    modifiers: [{ groupId: "g1", optionId: "o1", name: "Cheese", quantity: 2 }],
    chefNotes: "Hot",
    course: 1,
    quantity: 2,
    unitPrice: 120,
    variantName: "Large",
  },
];
const item: any = {
  id: "m1",
  name: "Burger",
  basePrice: "100",
  description: "Tasty",
  variants: [{ id: "v1", name: "Large", price: "120" }],
  modifierGroupLinks: [
    {
      group: {
        id: "g1",
        name: "Extras",
        selectionType: "MULTIPLE",
        minSelections: 0,
        maxSelections: 2,
        options: [
          {
            id: "o1",
            name: "Cheese",
            additionalPrice: "10",
            maxQuantity: 2,
            isAvailable: true,
          },
        ],
      },
    },
  ],
  tags: ["Popular"],
  allergens: ["Milk"],
};

describe("remaining menu components", () => {
  it("renders cart contents, totals and validation state", () => {
    const html = renderToStaticMarkup(
      <CartSummary
        cart={cart}
        combos={[]}
        menuById={new Map()}
        isAddingToExisting={false}
        courseSequencingAvailable={false}
        courseMode={false}
        onCourseModeChange={vi.fn()}
        roundCourseNumber={1}
        onRoundCourseNumberChange={vi.fn()}
        onUpdateCourse={vi.fn()}
        onUpdateComboCourse={vi.fn()}
        orderNotes="note"
        onOrderNotesChange={vi.fn()}
        couponCode=""
        onCouponCodeChange={vi.fn()}
        promotions={[]}
        selectedPromotionIds={[]}
        onTogglePromotion={vi.fn()}
        totalItems={2}
        totalPrice={240}
        isPending={false}
        needsTable
        onUpdateQty={vi.fn()}
        onUpdateComboQty={vi.fn()}
        onSubmit={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(html).toContain("Burger");
    expect(html).toContain("₹240.00");
    expect(html).toContain("Select a table");
  });

  it("renders search input", () => {
    expect(
      renderToStaticMarkup(<SearchBar value="burger" onChange={vi.fn()} />),
    ).toContain("Search menu");
  });

  it("renders customiser with variants and modifiers", () => {
    const html = renderToStaticMarkup(
      <ItemCustomiser item={item} onConfirm={vi.fn()} onClose={vi.fn()} />,
    );
    expect(html).toContain("Large");
    expect(html).toContain("Extras");
    expect(html).toContain("Cheese");
  });

  it("renders build-your-own items as a guided step flow", () => {
    const guidedItem = {
      ...item,
      displayMode: "GUIDED_BUILDER",
      modifierGroupLinks: [
        {
          group: {
            ...item.modifierGroupLinks[0].group,
            minSelections: 1,
          },
        },
        {
          group: {
            id: "g2",
            name: "Sauce",
            selectionType: "SINGLE",
            minSelections: 1,
            maxSelections: 1,
            options: [
              {
                id: "o2",
                name: "Mint",
                additionalPrice: "0",
                maxQuantity: 1,
                isAvailable: true,
              },
            ],
          },
        },
      ],
    };
    const html = renderToStaticMarkup(
      <ItemCustomiser
        item={guidedItem}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(html).toContain("Build your dish");
    expect(html).toContain("Step 1 of 2");
    expect(html).toContain("Extras");
    expect(html).not.toContain("Sauce");
    expect(html).toContain("Next step");
  });
});
