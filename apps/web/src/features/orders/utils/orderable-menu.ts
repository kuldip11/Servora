import type { MenuCategory, MenuItem } from "@pos/types";

interface ActiveMenuSummary {
  id: string;
  memberships: Array<{ menuItemId: string }>;
}

export const isOrderableMenuItem = (item: MenuItem, asOf = new Date()) => {
  if (!item.isPublished) return false;
  if (item.effectiveFrom && new Date(item.effectiveFrom) > asOf) return false;
  if (item.isAvailable === false) return false;
  return item.status === "ACTIVE" || item.status === "SEASONAL";
};

export const scopeCategoriesForOrder = (
  categories: MenuCategory[] | undefined,
  activeMenus: ActiveMenuSummary[],
  selectedMenuId: string,
  asOf = new Date(),
) => {
  const visibleItemIds = new Set(
    activeMenus
      .filter((menu) => !selectedMenuId || menu.id === selectedMenuId)
      .flatMap((menu) =>
        menu.memberships.map((membership) => membership.menuItemId),
      ),
  );

  return categories
    ?.map((category) => ({
      ...category,
      menuItems: (category.menuItems ?? []).filter(
        (item) =>
          visibleItemIds.has(item.id) && isOrderableMenuItem(item, asOf),
      ),
    }))
    .filter((category) => category.menuItems.length > 0);
};
