import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../store/auth', () => ({
  useAuthStore: { getState: () => ({ franchiseId: 'fr-1', branchId: 'br-1' }) },
}));

import { menuKeys } from '../query-keys';

describe('menuKeys', () => {
  it('separates branch-scoped and franchise-scoped resources', () => {
    expect(menuKeys.categories()).toEqual(['menu', 'branch-context', 'fr-1', 'br-1', 'categories']);
    expect(menuKeys.tags()).toEqual(['menu', 'franchise', 'fr-1', 'tags']);
    expect(menuKeys.allergens()).toEqual(['menu', 'franchise', 'fr-1', 'allergens']);
    expect(menuKeys.modifierGroups()).toEqual([
      'menu',
      'branch-context',
      'fr-1',
      'br-1',
      'modifier-groups',
    ]);
  });

  it('includes the item id for item-specific resources', () => {
    expect(menuKeys.itemSchedules('item-1')).toEqual([
      'menu', 'branch-context', 'fr-1', 'br-1', 'item-schedules', 'item-1',
    ]);
    expect(menuKeys.itemRecipe('item-1')).toEqual([
      'menu', 'branch-context', 'fr-1', 'br-1', 'item-recipe', 'item-1',
    ]);
    expect(menuKeys.branchOverrides('item-1')).toEqual([
      'menu', 'branch-context', 'fr-1', 'br-1', 'branch-overrides', 'item-1',
    ]);
  });
});
