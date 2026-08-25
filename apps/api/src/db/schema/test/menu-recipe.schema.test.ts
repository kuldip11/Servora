import { describe, expect, it } from 'vitest';
import { getTableConfig } from 'drizzle-orm/pg-core';
import { recipes } from '../menu-recipe.schema';

function expectTable(table: Parameters<typeof getTableConfig>[0], name: string, columns: string[]) {
  const config = getTableConfig(table);
  expect(config.name).toBe(name);
  expect(Object.keys((table as any)[Symbol.for('drizzle:Columns')])).toEqual(expect.arrayContaining(columns));
}

describe('menu-recipe.schema.ts', () => {
  it('defines recipes with its contract columns', () => {
    expectTable(recipes, 'recipes', ['id', 'menuItemId', 'inventoryItemId', 'quantityRequired', 'unit', 'isOptional', 'createdAt']);
  });
});
