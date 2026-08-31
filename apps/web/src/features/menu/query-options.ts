import { queryOptions } from "@tanstack/react-query";
import { menuItemsService } from "./services/menu-items.service";
import { menuTagsService } from "./services/menu-tags.service";
import { modifierGroupsService } from "./services/modifier-groups.service";
import { menuAllergensService } from "./services/menu-allergens.service";
import { menuHolidaysService } from "./services/menu-holidays.service";
import { menuTemplatesService } from "./services/menu-templates.service";
import { menuSchedulesService } from "./services/menu-schedules.service";
import { menuRecipesService } from "./services/menu-recipes.service";
import { menuBranchOverridesService } from "./services/menu-branch-overrides.service";
import { menuKeys } from "./query-keys";

export const menuCategoriesQuery = () => {
  return queryOptions({
    queryKey: menuKeys.categories(),
    queryFn: () => menuItemsService.listCategories(),
    staleTime: 1000 * 60 * 5,
  });
};

export const menuTagsQuery = () => {
  return queryOptions({
    queryKey: menuKeys.tags(),
    queryFn: () => menuTagsService.list(),
    staleTime: 1000 * 60 * 10,
  });
};

export const modifierGroupsQuery = () => {
  return queryOptions({
    queryKey: menuKeys.modifierGroups(),
    queryFn: () => modifierGroupsService.list(),
    staleTime: 1000 * 60 * 5,
  });
};

export const menuAllergensQuery = () => {
  return queryOptions({
    queryKey: menuKeys.allergens(),
    queryFn: () => menuAllergensService.list(),
    staleTime: 1000 * 60 * 10,
  });
};

export const menuHolidaysQuery = () => {
  return queryOptions({
    queryKey: menuKeys.holidays(),
    queryFn: () => menuHolidaysService.list(),
    staleTime: 1000 * 60 * 10,
  });
};

export const menuTemplatesQuery = () => {
  return queryOptions({
    queryKey: menuKeys.templates(),
    queryFn: () => menuTemplatesService.list(),
    staleTime: 1000 * 60 * 10,
  });
};

export const menuItemSchedulesQuery = (itemId: string) => {
  return queryOptions({
    queryKey: menuKeys.itemSchedules(itemId),
    queryFn: () => menuSchedulesService.list(itemId),
  });
};

export const menuItemRecipeQuery = (itemId: string) => {
  return queryOptions({
    queryKey: menuKeys.itemRecipe(itemId),
    queryFn: () => menuRecipesService.get(itemId),
  });
};

export const menuItemBranchOverridesQuery = (itemId: string) => {
  return queryOptions({
    queryKey: menuKeys.branchOverrides(itemId),
    queryFn: () => menuBranchOverridesService.list(itemId),
  });
};
