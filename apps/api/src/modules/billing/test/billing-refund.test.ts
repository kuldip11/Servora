import { describe, expect, it } from "vitest";
import { resolveRefundEligibility } from "../billing-refund";

describe("resolveRefundEligibility", () => {
  it("accepts successful refunds up to the payment amount", () => {
    expect(resolveRefundEligibility("SUCCESS", 100, 100)).toEqual({ ok: true });
    expect(resolveRefundEligibility("SUCCESS", 100, 25)).toEqual({ ok: true });
  });
  it("rejects non-successful payments", () => {
    expect(resolveRefundEligibility("PENDING", 100, 10)).toEqual({
      ok: false,
      reason: "PAYMENT_NOT_REFUNDABLE",
    });
  });
  it("rejects refunds larger than the payment", () => {
    expect(resolveRefundEligibility("SUCCESS", 100, 100.01)).toEqual({
      ok: false,
      reason: "REFUND_AMOUNT_EXCEEDS_PAYMENT",
    });
  });
});
