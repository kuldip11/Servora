import { describe, expect, it } from "vitest";
import { getTableConfig } from "drizzle-orm/pg-core";
import {
  bills,
  payments,
  paymentRefunds,
  paymentMethodEnum,
  paymentStatusEnum,
} from "../billing.schema";
function expectTable(table: any, name: string, columns: string[]) {
  const actual = Object.keys(table[Symbol.for("drizzle:Columns")]);
  expect(getTableConfig(table).name).toBe(name);
  expect(actual).toEqual(expect.arrayContaining(columns));
  expect(actual).toHaveLength(columns.length);
}
describe("billing.schema.ts", () => {
  it("defines bills", () =>
    expectTable(bills, "bills", [
      "id",
      "orderId",
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
      "metadata",
      "createdAt",
      "updatedAt",
    ]));
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
