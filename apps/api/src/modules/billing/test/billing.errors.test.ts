import { describe, expect, it } from "vitest";
import {
  billNotFound,
  orderNotFound,
  paymentNotFound,
  paymentNotRefundable,
  refundExceedsPaymentAmount,
} from "../billing.errors";

describe("billing errors", () => {
  it("creates stable not-found errors with preserved reasons", () => {
    expect(orderNotFound("o1").toJSON()).toMatchObject({ code: "NOT_FOUND" });
    expect(orderNotFound("o1").details).toMatchObject({
      reason: "ORDER_NOT_FOUND",
    });
    expect(paymentNotFound("p1").details).toMatchObject({
      reason: "PAYMENT_NOT_FOUND",
    });
    expect(billNotFound("b1").details).toMatchObject({
      reason: "BILL_NOT_FOUND",
    });
  });
  it("maps refund rules to domain-rule errors", () => {
    expect(paymentNotRefundable().toJSON()).toMatchObject({
      code: "DOMAIN_RULE_VIOLATION",
    });
    expect(paymentNotRefundable().details).toMatchObject({
      reason: "PAYMENT_NOT_REFUNDABLE",
    });
    expect(refundExceedsPaymentAmount().details).toMatchObject({
      reason: "REFUND_AMOUNT_EXCEEDS_PAYMENT",
    });
  });
});
