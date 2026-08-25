import { branchQueryContextKey, franchiseQueryContextKey } from '../../shared/lib/query-context';

export const menuKeys = {
  all: ['menu'] as const,
  categories: () => [...menuKeys.all, ...branchQueryContextKey(), 'categories'] as const,
  tags: () => [...menuKeys.all, ...franchiseQueryContextKey(), 'tags'] as const,
  allergens: () => [...menuKeys.all, ...franchiseQueryContextKey(), 'allergens'] as const,
  modifierGroups: () => [...menuKeys.all, ...branchQueryContextKey(), 'modifier-groups'] as const,
  holidays: () => [...menuKeys.all, ...franchiseQueryContextKey(), 'holidays'] as const,
  templates: () => [...menuKeys.all, ...franchiseQueryContextKey(), 'templates'] as const,
  itemSchedules: (itemId: string) => [...menuKeys.all, ...branchQueryContextKey(), 'item-schedules', itemId] as const,
  itemRecipe: (itemId: string) => [...menuKeys.all, ...branchQueryContextKey(), 'item-recipe', itemId] as const,
  branchOverrides: (itemId: string) => [...menuKeys.all, ...branchQueryContextKey(), 'branch-overrides', itemId] as const,
};
