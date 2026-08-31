import { describe, expect, it } from "vitest";
import { getTableConfig } from "drizzle-orm/pg-core";
import {
  bills,
  payments,
  paymentRefunds,
  paymentMethodEnum,
  paymentStatusEnum,
  billOrderItems,
} from "../billing.schema";
function expectTable(table: any, name: string, columns: string[]) {
  const actual = Object.keys(table[Symbol.for("drizzle:Columns")]);
  expect(getTableConfig(table).name).toBe(name);
  expect(actual).toEqual(expect.arrayContaining(columns));
}
describe("billing.schema.ts", () => {
  it("defines bills", () =>
    expectTable(bills, "bills", [
      "id",
      "orderId",
      "splitLabel",
      "subtotal",
      "taxAmount",
      "discountAmount",
      "totalAmount",
      "gstNumber",
      "createdAt",
    ]));
  it("defines payments", () =>
    expectTable(payments, "payments", [
      "id",
      "orderId",
      "billId",
      "method",
      "status",
      "amount",
      "reference",
      "gatewayOrderId",
      "gatewayPaymentId",
      "metadata",
      "createdAt",
      "updatedAt",
    ]));
  it("assigns every order item to at most one bill", () => {
    expectTable(billOrderItems, "bill_order_items", ["id", "billId", "orderItemId"]);
    expect(getTableConfig(billOrderItems).indexes.some((index) => index.config.unique)).toBe(true);
  });
  it("defines payment_refunds", () =>
    expectTable(paymentRefunds, "payment_refunds", [
      "id",
      "paymentId",
      "amount",
      "reason",
      "processedBy",
      "createdAt",
    ]));
  it("keeps payment enums stable", () => {
    expect(paymentMethodEnum.enumValues).toEqual([
      "CASH",
      "CARD",
      "UPI",
      "RAZORPAY",
      "STRIPE",
    ]);
    expect(paymentStatusEnum.enumValues).toEqual([
      "PENDING",
      "SUCCESS",
      "FAILED",
      "REFUNDED",
    ]);
  });
});
