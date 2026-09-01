import { describe, expect, it } from "vitest";
import { getTableConfig } from "drizzle-orm/pg-core";
import {
  inventoryItems,
  inventoryTransactions,
  orderInventoryDeductions,
  wasteReasons,
  inventoryUnitEnum,
  inventoryTransactionTypeEnum,
} from "@/db/schema/inventory.schema";
const expectTable = (table: any, name: string, columns: string[]) => {
  const actual = Object.keys(table[Symbol.for("drizzle:Columns")]);
  expect(getTableConfig(table).name).toBe(name);
  expect(actual).toEqual(expect.arrayContaining(columns));
  expect(actual).toHaveLength(columns.length);
};
describe("inventory.schema.ts", () => {
  it("defines inventory_items", () =>
    expectTable(inventoryItems, "inventory_items", [
      "id",
      "tenantId",
      "branchId",
      "name",
      "unit",
      "currentStock",
      "minimumStock",
      "reorderPoint",
      "costPerUnit",
      "isActive",
      "deletedAt",
      "createdAt",
      "updatedAt",
    ]));
  it("defines inventory_transactions", () =>
    expectTable(inventoryTransactions, "inventory_transactions", [
      "id",
      "inventoryItemId",
      "transactionType",
      "quantity",
      "balanceBefore",
      "balanceAfter",
      "notes",
      "performedBy",
      "wasteReasonId",
      "reversalOfDeductionId",
      "createdAt",
    ]));
  it("defines waste_reasons", () =>
    expectTable(wasteReasons, "waste_reasons", [
      "id",
      "tenantId",
      "label",
      "isActive",
      "createdAt",
      "updatedAt",
    ]));
  it("defines order_inventory_deductions", () =>
    expectTable(orderInventoryDeductions, "order_inventory_deductions", [
      "id",
      "orderId",
      "kitchenTicketId",
      "orderItemId",
      "menuItemId",
      "inventoryItemId",
      "quantityDeducted",
      "unit",
      "wasShort",
      "deductedAt",
      "reversedAt",
    ]));
  it("keeps inventory enums stable", () => {
    expect(inventoryUnitEnum.enumValues).toEqual([
      "KG",
      "GRAMS",
      "LITERS",
      "ML",
      "PIECES",
      "PACKETS",
    ]);
    expect(inventoryTransactionTypeEnum.enumValues).toEqual([
      "IN",
      "OUT",
      "ADJUSTMENT",
      "WASTE",
    ]);
  });
});
