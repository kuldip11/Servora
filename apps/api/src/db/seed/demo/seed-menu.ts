import { db } from "@/db";
import {
  itemStationRouting,
  menuCategories,
  menuItemModifierGroups,
  menuItems,
  menuItemVariants,
  menuMemberships,
  menus,
  modifierGroups,
  modifierOptions,
} from "@/db/schema";
import type { DemoConfig, SeedContext } from "./types";
import { money, uuidFor } from "./utils";

const descriptors = [
  "Classic",
  "House",
  "Signature",
  "Smoky",
  "Spicy",
  "Herb",
  "Cheesy",
  "Roasted",
  "Creamy",
  "Fresh",
];

export const seedMenus = async (
  config: DemoConfig,
  ctx: SeedContext,
): Promise<void> => {
  for (const [brandIndex, brand] of config.brands.entries()) {
    const tenantId = ctx.tenantIds[brand.key]!;
    const menuId = uuidFor(`menu:${brand.key}`);
    await db.insert(menus).values({
      id: menuId,
      tenantId,
      name: `${brand.name} All Day Menu`,
      description: "Published enterprise demo menu",
      status: "PUBLISHED",
      isDefault: true,
      availableChannels: ["STAFF", "CUSTOMER_QR"],
      availableFulfillmentTypes: ["DINE_IN", "TAKEAWAY", "DELIVERY", "ONLINE"],
      effectiveFrom: new Date("2025-01-01T00:00:00Z"),
    });
    await db.insert(menus).values({
      id: uuidFor(`menu:${brand.key}:draft`),
      tenantId,
      name: `${brand.name} Seasonal Draft`,
      description: "Unpublished menu for draft and editing test cases",
      status: "DRAFT",
      isDefault: false,
      availableChannels: ["STAFF"],
      availableFulfillmentTypes: ["DINE_IN"],
    });

    const categoryRows = brand.categoryNames.map((name, index) => ({
      id: uuidFor(`category:${brand.key}:${index}`),
      tenantId,
      name,
      description: `${name} from ${brand.name}`,
      sortOrder: index + 1,
      isActive: true,
    }));
    await db.insert(menuCategories).values(categoryRows);

    const itemRows = Array.from(
      { length: brand.menuItemCount },
      (_, itemIndex) => {
        const root = brand.itemRoots[itemIndex % brand.itemRoots.length]!;
        const cycle = Math.floor(itemIndex / brand.itemRoots.length);
        const name =
          cycle === 0
            ? root
            : `${descriptors[(cycle + itemIndex) % descriptors.length]} ${root}`;
        const categoryId = categoryRows[itemIndex % categoryRows.length]!.id;
        const base = 89 + ((itemIndex * 37 + brandIndex * 29) % 510);
        return {
          id: uuidFor(`item:${brand.key}:${itemIndex}`),
          tenantId,
          categoryId,
          name,
          description: `Freshly prepared ${name.toLowerCase()} — demo menu item with realistic pricing and preparation data.`,
          basePrice: money(base),
          manualCost: money(base * (0.24 + (itemIndex % 8) * 0.012)),
          taxRate: "5.00",
          taxMode: "EXCLUSIVE" as const,
          foodType: (["VEG", "NON_VEG", "EGG"] as const)[itemIndex % 3]!,
          spiceLevel: (["NONE", "MILD", "MEDIUM", "HOT"] as const)[
            itemIndex % 4
          ]!,
          pricingMode: (["FIXED", "WEIGHT_BASED", "OPEN"] as const)[
            itemIndex % 3
          ]!,
          weightUnit: itemIndex % 3 === 1 ? ("KG" as const) : null,
          openPriceMin: itemIndex % 3 === 2 ? money(base * 0.75) : null,
          openPriceMax: itemIndex % 3 === 2 ? money(base * 1.5) : null,
          sku: `${brand.key.toUpperCase()}-${String(itemIndex + 1).padStart(4, "0")}`,
          prepTimeMinutes: 5 + (itemIndex % 26),
          sortOrder: itemIndex + 1,
          status: (
            [
              "ACTIVE",
              "OUT_OF_STOCK",
              "HIDDEN",
              "SEASONAL",
              "DISCONTINUED",
            ] as const
          )[itemIndex % 5]!,
          enableRecipeDeduction: true,
          isPublished: true,
          publishedAt: new Date("2025-01-01T00:00:00Z"),
        };
      },
    );
    for (let i = 0; i < itemRows.length; i += 250)
      await db.insert(menuItems).values(itemRows.slice(i, i + 250));

    const memberships = itemRows.map((item, index) => ({
      id: uuidFor(`menu-membership:${brand.key}:${index}`),
      menuId,
      menuItemId: item.id,
      categoryId: item.categoryId,
      sortOrder: index + 1,
    }));
    for (let i = 0; i < memberships.length; i += 500)
      await db.insert(menuMemberships).values(memberships.slice(i, i + 500));

    const variantItems = itemRows
      .filter((_, index) => index % 4 === 0)
      .slice(0, Math.max(4, Math.floor(itemRows.length / 5)));
    const variantRows = variantItems.flatMap((item, index) => [
      {
        id: uuidFor(`variant:${brand.key}:${index}:regular`),
        menuItemId: item.id,
        name: "Regular",
        price: item.basePrice,
        status: "ACTIVE" as const,
      },
      {
        id: uuidFor(`variant:${brand.key}:${index}:large`),
        menuItemId: item.id,
        name: "Large",
        price: money(Number(item.basePrice) * 1.28),
        status: "ACTIVE" as const,
      },
    ]);
    if (variantRows.length)
      await db.insert(menuItemVariants).values(variantRows);

    const modifierGroupId = uuidFor(`modifier-group:${brand.key}:addons`);
    await db
      .insert(modifierGroups)
      .values({
        id: modifierGroupId,
        tenantId,
        name: "Popular Add-ons",
        selectionType: "MULTIPLE",
        groupType: "ADDON",
        minSelections: 0,
        maxSelections: 3,
        sortOrder: 1,
      });
    await db.insert(modifierOptions).values([
      {
        id: uuidFor(`modifier:${brand.key}:extra-cheese`),
        modifierGroupId,
        name: "Extra Cheese",
        additionalPrice: "59.00",
        maxQuantity: 2,
        sortOrder: 1,
      },
      {
        id: uuidFor(`modifier:${brand.key}:extra-protein`),
        modifierGroupId,
        name: "Extra Protein",
        additionalPrice: "99.00",
        maxQuantity: 2,
        sortOrder: 2,
      },
      {
        id: uuidFor(`modifier:${brand.key}:sauce`),
        modifierGroupId,
        name: "House Sauce",
        additionalPrice: "29.00",
        maxQuantity: 2,
        sortOrder: 3,
      },
    ]);
    await db
      .insert(menuItemModifierGroups)
      .values(
        itemRows
          .filter((_, index) => index % 3 === 0)
          .map((item) => ({
            menuItemId: item.id,
            modifierGroupId,
            sortOrder: 1,
          })),
      );

    const routingBranchIndex = 0;
    const hotStation = uuidFor(
      `station:${brand.key}:${routingBranchIndex}:hot`,
    );
    const beverageStation = uuidFor(
      `station:${brand.key}:${routingBranchIndex}:beverage`,
    );
    const routes = itemRows.map((item, index) => ({
      id: uuidFor(`route:${brand.key}:${index}`),
      menuItemId: item.id,
      stationId: index % 5 === 0 ? beverageStation : hotStation,
    }));
    for (let i = 0; i < routes.length; i += 500)
      await db.insert(itemStationRouting).values(routes.slice(i, i + 500));
  }
};
