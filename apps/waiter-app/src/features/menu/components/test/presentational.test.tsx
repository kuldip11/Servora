import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CategoryTabs } from "@/features/menu/components/CategoryTabs";
import { MenuItemCard } from "@/features/menu/components/MenuItemCard";
import { MenuGrid } from "@/features/menu/components/MenuGrid";
import {
  buildTableOptions,
  OrderOptionsPanel,
} from "@/features/menu/components/OrderOptionsPanel";
import { TabletOrderRail } from "@/features/menu/components/TabletOrderRail";

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
          categories={[
            {
              id: "c1",
              name: "Starters",
              tenantId: "t1",
              branchId: null,
              description: null,
              isActive: true,
              sortOrder: 0,
            },
          ]}
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
          categories={[
            {
              id: "c1",
              name: "Starters",
              tenantId: "t1",
              branchId: null,
              description: null,
              isActive: true,
              sortOrder: 0,
            },
          ]}
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
    ).toContain("Customisable");
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

  it("renders the tablet order rail with live totals", () => {
    const html = renderToStaticMarkup(
      <TabletOrderRail
        cart={[
          {
            menuItemId: "m1",
            name: "Burger",
            basePrice: 150,
            modifiers: [],
            quantity: 2,
            chefNotes: "",
            unitPrice: 150,
          },
        ]}
        combos={[]}
        totalItems={2}
        totalPrice={300}
        isAddingToExisting={false}
        onUpdateQty={vi.fn()}
        onUpdateComboQty={vi.fn()}
        onEditItem={vi.fn()}
        onReview={vi.fn()}
      />,
    );
    expect(html).toContain("Current order");
    expect(html).toContain("Burger");
    expect(html).toContain("₹300.00");
  });

  it("allows only available tables to be selected", () => {
    const options = buildTableOptions([
      {
        id: "free",
        name: "Table 1",
        capacity: 4,
        status: "AVAILABLE",
        isActive: true,
      },
      {
        id: "reserved",
        name: "Table 2",
        capacity: 2,
        status: "RESERVED",
        isActive: true,
      },
      {
        id: "occupied",
        name: "Table 3",
        capacity: 6,
        status: "OCCUPIED",
        isActive: true,
      },
    ] as any);

    expect(options.find((option) => option.value === "free")?.disabled).toBe(
      false,
    );
    expect(
      options.find((option) => option.value === "reserved")?.disabled,
    ).toBe(true);
    expect(
      options.find((option) => option.value === "occupied")?.disabled,
    ).toBe(true);
  });
});
