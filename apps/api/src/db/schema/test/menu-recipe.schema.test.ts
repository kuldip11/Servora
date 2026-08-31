import { describe, expect, it } from "vitest";
import { getTableConfig } from "drizzle-orm/pg-core";
import {
  recipes,
  subRecipes,
  subRecipeIngredients,
} from "@/db/schema/menu-recipe.schema";

const expectTable = (
  table: Parameters<typeof getTableConfig>[0],
  name: string,
  columns: string[],
) => {
  const config = getTableConfig(table);
  expect(config.name).toBe(name);
  expect(Object.keys((table as any)[Symbol.for("drizzle:Columns")])).toEqual(
    expect.arrayContaining(columns),
  );
};

describe("menu-recipe.schema.ts", () => {
  it("defines recipes with its contract columns", () => {
    expectTable(recipes, "recipes", [
      "id",
      "menuItemId",
      "inventoryItemId",
      "subRecipeId",
      "variantId",
      "modifierOptionId",
      "quantityRequired",
      "unit",
      "yieldPercent",
      "isOptional",
      "createdAt",
    ]);
  });
  it("defines branch-scoped prepared components and recursive ingredients", () => {
    expectTable(subRecipes, "sub_recipes", [
      "id",
      "tenantId",
      "branchId",
      "name",
      "yieldQuantity",
      "yieldUnit",
      "yieldPercent",
      "createdAt",
      "updatedAt",
    ]);
    expectTable(subRecipeIngredients, "sub_recipe_ingredients", [
      "id",
      "subRecipeId",
      "inventoryItemId",
      "ingredientSubRecipeId",
      "quantityRequired",
      "unit",
      "createdAt",
    ]);
  });
});
