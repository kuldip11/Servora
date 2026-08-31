import { describe, expect, it } from "vitest";
import { getTableConfig } from "drizzle-orm/pg-core";
import {
  kitchenTickets,
  orderItems,
  orderItemModifiers,
  orderStatusHistory,
  kitchenTicketStatusEnum,
} from "@/db/schema/kitchen.schema";
const expectTable = (table: any, name: string, columns: string[]) => {
  const actual = Object.keys(table[Symbol.for("drizzle:Columns")]);
  expect(getTableConfig(table).name).toBe(name);
  expect(actual).toEqual(expect.arrayContaining(columns));
};
describe("kitchen.schema.ts", () => {
  it("defines kitchen_tickets", () =>
    expectTable(kitchenTickets, "kitchen_tickets", [
      "id",
      "tenantId",
      "branchId",
      "orderId",
      "ticketNumber",
      "status",
      "notes",
      "firedAt",
      "readyAt",
      "servedAt",
      "createdAt",
      "updatedAt",
    ]));
  it("defines order_items", () =>
    expectTable(orderItems, "order_items", [
      "id",
      "orderId",
      "kitchenTicketId",
      "menuItemId",
      "menuItemName",
      "variantId",
      "variantName",
      "quantity",
      "unitPrice",
      "subtotal",
      "taxRate",
      "pricingAttribution",
      "chefNotes",
      "seatLabel",
      "fulfillmentType",
      "createdAt",
    ]));
  it("defines order_item_modifiers", () =>
    expectTable(orderItemModifiers, "order_item_modifiers", [
      "id",
      "orderItemId",
      "modifierId",
      "modifierGroupName",
      "name",
      "price",
      "quantity",
    ]));
  it("defines order_status_history", () =>
    expectTable(orderStatusHistory, "order_status_history", [
      "id",
      "orderId",
      "oldStatus",
      "newStatus",
      "changedBy",
      "reason",
      "changedAt",
    ]));
  it("keeps kitchen ticket enum stable", () =>
    expect(kitchenTicketStatusEnum.enumValues).toEqual([
      "PENDING_PAYMENT",
      "HELD",
      "FIRED",
      "PREPARING",
      "READY",
      "SERVED",
    ]));
});
