import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CategoryTabs } from "../CategoryTabs";
import { MenuItemCard } from "../MenuItemCard";
import { MenuGrid } from "../MenuGrid";
import { OrderOptionsPanel } from "../OrderOptionsPanel";

const item: any = {
  id: "m1",
  name: "Burger",
  description: "Tasty",
  foodType: "NON_VEG",
  basePrice: 150,
  prepTimeMinutes: 10,
  variants: [{ id: "v1" }],
  modifierGroupLinks: [],
};
describe("menu presentational components", () => {
  it("renders category filters and hides categories during search", () => {
    expect(
      renderToStaticMarkup(
        <CategoryTabs
          foodTypeFilter="ALL"
          onFoodTypeChange={vi.fn()}
          categories={[{ id: "c1", name: "Starters" }]}
          activeCategory="c1"
          onCategoryChange={vi.fn()}
          menuSearch=""
        />,
      ),
    ).toContain("Starters");
    expect(
      renderToStaticMarkup(
        <CategoryTabs
          foodTypeFilter="VEG"
          onFoodTypeChange={vi.fn()}
          categories={[{ id: "c1", name: "Starters" }]}
          activeCategory={null}
          onCategoryChange={vi.fn()}
          menuSearch="burger"
        />,
      ),
    ).not.toContain("Starters");
  });
  it("renders menu item add and quantity states", () => {
    expect(
      renderToStaticMarkup(
        <MenuItemCard
          item={item}
          cartQty={2}
          singleCart={false}
          onTap={vi.fn()}
          onQtyChange={vi.fn()}
        />,
      ),
    ).toContain("Options");
    expect(
      renderToStaticMarkup(
        <MenuItemCard
          item={item}
          cartQty={2}
          singleCart={{ quantity: 2 } as any}
          onTap={vi.fn()}
          onQtyChange={vi.fn()}
        />,
      ),
    ).toContain("Decrease quantity");
  });
  it("renders loading and populated menu grids", () => {
    expect(
      renderToStaticMarkup(
        <MenuGrid
          items={[]}
          cart={[]}
          isLoading
          menuSearch=""
          onItemTap={vi.fn()}
          onQtyChange={vi.fn()}
        />,
      ),
    ).toBeTruthy();
    expect(
      renderToStaticMarkup(
        <MenuGrid
          items={[item]}
          cart={[]}
          isLoading={false}
          menuSearch=""
          onItemTap={vi.fn()}
          onQtyChange={vi.fn()}
        />,
      ),
    ).toContain("Burger");
  });
  it("renders order option panel variants", () => {
    const html = renderToStaticMarkup(
      <OrderOptionsPanel
        availableOrderTypes={[{ value: "DINE_IN", label: "Dine In" }] as any}
        orderType="DINE_IN"
        onOrderTypeChange={vi.fn()}
        tablesEnabled
        tables={[{ id: "t1", name: "Table 1" }] as any}
        tableId="t1"
        onTableChange={vi.fn()}
        customerId=""
        customerName="A"
        onClearCustomer={vi.fn()}
        customerSearch=""
        onCustomerSearchChange={vi.fn()}
        customerResults={[]}
        onSelectCustomer={vi.fn()}
        customerGroups={[]}
        customerGroupId=""
        onCustomerGroupChange={vi.fn()}
        billingMode="LINE_ITEMS"
        onBillingModeChange={vi.fn()}
        coverCount={1}
        onCoverCountChange={vi.fn()}
        perCoverRules={[]}
        perCoverPriceRuleId=""
        onPerCoverPriceRuleChange={vi.fn()}
      />,
    );
    expect(html).toContain("Dine In");
  });
});
