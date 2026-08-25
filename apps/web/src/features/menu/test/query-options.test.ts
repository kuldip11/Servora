import { describe, expect, it, vi } from 'vitest';

const serviceFns = vi.hoisted(() => ({
  listCategories: vi.fn(),
  listTags: vi.fn(),
  listModifiers: vi.fn(),
  listAllergens: vi.fn(),
  listHolidays: vi.fn(),
  listTemplates: vi.fn(),
  listSchedules: vi.fn(),
  getRecipe: vi.fn(),
  listOverrides: vi.fn(),
}));

vi.mock('../services/menu-items.service', () => ({
  menuItemsService: { listCategories: serviceFns.listCategories },
}));
vi.mock('../services/menu-tags.service', () => ({
  menuTagsService: { list: serviceFns.listTags },
}));
vi.mock('../services/modifier-groups.service', () => ({
  modifierGroupsService: { list: serviceFns.listModifiers },
}));
vi.mock('../services/menu-allergens.service', () => ({
  menuAllergensService: { list: serviceFns.listAllergens },
}));
vi.mock('../services/menu-holidays.service', () => ({
  menuHolidaysService: { list: serviceFns.listHolidays },
}));
vi.mock('../services/menu-templates.service', () => ({
  menuTemplatesService: { list: serviceFns.listTemplates },
}));
vi.mock('../services/menu-schedules.service', () => ({
  menuSchedulesService: { list: serviceFns.listSchedules },
}));
vi.mock('../services/menu-recipes.service', () => ({
  menuRecipesService: { get: serviceFns.getRecipe },
}));
vi.mock('../services/menu-branch-overrides.service', () => ({
  menuBranchOverridesService: { list: serviceFns.listOverrides },
}));
vi.mock('../../../store/auth', () => ({
  useAuthStore: { getState: () => ({ franchiseId: 'fr-1', branchId: 'br-1' }) },
}));

import {
  menuCategoriesQuery,
  menuTagsQuery,
  modifierGroupsQuery,
  menuAllergensQuery,
  menuHolidaysQuery,
  menuTemplatesQuery,
  menuItemSchedulesQuery,
  menuItemRecipeQuery,
  menuItemBranchOverridesQuery,
} from '../query-options';

describe('menu query definitions', () => {
  it('binds categories, tags, modifiers, allergens, holidays, and templates', () => {
    expect(menuCategoriesQuery().queryFn).toEqual(expect.any(Function));
    expect(menuTagsQuery().queryFn).toEqual(expect.any(Function));
    expect(modifierGroupsQuery().queryFn).toEqual(expect.any(Function));
    expect(menuAllergensQuery().queryFn).toEqual(expect.any(Function));
    expect(menuHolidaysQuery().queryFn).toEqual(expect.any(Function));
    expect(menuTemplatesQuery().queryFn).toEqual(expect.any(Function));
  });

  it('uses the documented freshness windows', () => {
    expect(menuCategoriesQuery().staleTime).toBe(300_000);
    expect(menuTagsQuery().staleTime).toBe(600_000);
    expect(modifierGroupsQuery().staleTime).toBe(300_000);
    expect(menuAllergensQuery().staleTime).toBe(600_000);
    expect(menuHolidaysQuery().staleTime).toBe(600_000);
    expect(menuTemplatesQuery().staleTime).toBe(600_000);
  });

  it('captures item ids in item-specific query keys and delegates through a function', () => {
    expect(menuItemSchedulesQuery('item-1').queryKey).toEqual([
      'menu', 'branch-context', 'fr-1', 'br-1', 'item-schedules', 'item-1',
    ]);
    expect(menuItemRecipeQuery('item-1').queryKey).toEqual([
      'menu', 'branch-context', 'fr-1', 'br-1', 'item-recipe', 'item-1',
    ]);
    expect(menuItemBranchOverridesQuery('item-1').queryKey).toEqual([
      'menu', 'branch-context', 'fr-1', 'br-1', 'branch-overrides', 'item-1',
    ]);
    expect(menuItemSchedulesQuery('item-1').queryFn).toEqual(expect.any(Function));
    expect(menuItemRecipeQuery('item-1').queryFn).toEqual(expect.any(Function));
    expect(menuItemBranchOverridesQuery('item-1').queryFn).toEqual(expect.any(Function));
  });
});
