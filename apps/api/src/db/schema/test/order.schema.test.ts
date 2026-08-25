import { describe, expect, it } from "vitest";
import { getTableConfig } from "drizzle-orm/pg-core";
import { orders, orderStatusEnum, orderTypeEnum } from "../order.schema";
function expectTable(table: any, name: string, columns: string[]) {
  const actual = Object.keys(table[Symbol.for("drizzle:Columns")]);
  expect(getTableConfig(table).name).toBe(name);
  expect(actual).toEqual(expect.arrayContaining(columns));
  expect(actual).toHaveLength(columns.length);
}
describe("order.schema.ts", () => {
  it("defines orders", () =>
    expectTable(orders, "orders", [
      "id",
      "tenantId",
      "branchId",
      "tableId",
      "customerId",
      "createdBy",
      "status",
      "type",
      "subtotal",
      "taxAmount",
      "discountAmount",
      "totalAmount",
      "notes",
      "createdAt",
      "updatedAt",
    ]));
  it("keeps order enums stable", () => {
    expect(orderStatusEnum.enumValues).toEqual([
      "OPEN",
      "BILL_REQUESTED",
      "PAID",
      "CLOSED",
      "CANCELLED",
    ]);
    expect(orderTypeEnum.enumValues).toEqual([
      "DINE_IN",
      "TAKEAWAY",
      "DELIVERY",
      "ONLINE",
    ]);
  });
});
