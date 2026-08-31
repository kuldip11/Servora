import { describe, expect, it } from "vitest";
import { createTableRelationsHelpers } from "drizzle-orm";
import * as schema from "../index";
import {
  tenantsRelations,
  usersRelations,
  ordersRelations,
  kitchenTicketsRelations,
  orderItemsRelations,
  billsRelations,
  paymentsRelations,
  paymentRefundsRelations,
  menuItemsRelations,
  menuCategoriesRelations,
  menuItemVariantsRelations,
  modifierGroupsRelations,
  modifierOptionsRelations,
  menuItemModifierGroupsRelations,
  menuTagsRelations,
  menuItemTagsRelations,
  menuAllergensRelations,
  menuItemAllergensRelations,
  menuItemImagesRelations,
  globalUserRolesRelations,
  rolesRelations,
  rolePermissionsRelations,
  refreshTokensRelations,
  restaurantTablesRelations,
  inventoryItemsRelations,
  subRecipesRelations,
  subRecipeIngredientsRelations,
  wasteReasonsRelations,
  recipesRelations,
  orderInventoryDeductionsRelations,
  inventoryTransactionsRelations,
  orderStatusHistoryRelations,
  orderItemModifiersRelations,
  branchesRelations,
  menuItemSchedulesRelations,
  holidaysRelations,
  menuItemBranchOverridesRelations,
  menuTemplatesRelations,
  menuTemplateItemsRelations,
} from "../relations";

const relationDefinitions = {
  tenantsRelations,
  usersRelations,
  ordersRelations,
  kitchenTicketsRelations,
  orderItemsRelations,
  billsRelations,
  paymentsRelations,
  paymentRefundsRelations,
  menuItemsRelations,
  menuCategoriesRelations,
  menuItemVariantsRelations,
  modifierGroupsRelations,
  modifierOptionsRelations,
  menuItemModifierGroupsRelations,
  menuTagsRelations,
  menuItemTagsRelations,
  menuAllergensRelations,
  menuItemAllergensRelations,
  menuItemImagesRelations,
  globalUserRolesRelations,
  rolesRelations,
  rolePermissionsRelations,
  refreshTokensRelations,
  restaurantTablesRelations,
  inventoryItemsRelations,
  subRecipesRelations,
  subRecipeIngredientsRelations,
  wasteReasonsRelations,
  recipesRelations,
  orderInventoryDeductionsRelations,
  inventoryTransactionsRelations,
  orderStatusHistoryRelations,
  orderItemModifiersRelations,
  branchesRelations,
  menuItemSchedulesRelations,
  holidaysRelations,
  menuItemBranchOverridesRelations,
  menuTemplatesRelations,
  menuTemplateItemsRelations,
};

describe("relations schema", () => {
  it("defines a relation object for every configured table", () => {
    expect(Object.keys(relationDefinitions)).toHaveLength(39);
    for (const relation of Object.values(relationDefinitions)) {
      expect(relation.table).toBeDefined();
      expect(typeof relation.config).toBe("function");
    }
  });

  it("materializes every relation callback against the current schema helpers", () => {
    for (const [name, relation] of Object.entries(relationDefinitions)) {
      const config = relation.config(
        createTableRelationsHelpers(relation.table),
      );
      expect(Object.keys(config).length, name).toBeGreaterThan(0);
      for (const value of Object.values(config)) {
        expect(value).toBeDefined();
      }
    }
  });

  it("keeps relation source tables aligned with the schema exports", () => {
    for (const relation of Object.values(relationDefinitions)) {
      const tableName = (relation.table as any)[Symbol.for("drizzle:Name")];
      expect(tableName).toBeDefined();
      expect(
        Object.values(schema).some((value: any) => value === relation.table),
      ).toBe(true);
    }
  });
});
