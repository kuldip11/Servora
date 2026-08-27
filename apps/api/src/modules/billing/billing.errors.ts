/**
 * Billing-specific error factories.
 *
 * The pre-refactor code threw bare `Error('SOME_CODE')` strings and every
 * route caught them into a flat `set.status = 400` — even "not found"
 * cases. Folding into the shared `AppError` taxonomy means two status
 * codes actually change here (disclosed in docs/NEXT_STEPS.md, verified
 * no frontend client hardcodes the old status or the old code string):
 *   - order/payment "not found" now correctly returns 404 via
 *     `NotFoundError`, instead of 400.
 *   - `PAYMENT_NOT_REFUNDABLE` / `REFUND_AMOUNT_EXCEEDS_PAYMENT` now
 *     correctly return 422 via `DomainRuleError`, instead of 400.
 * `GET /bills/:id`'s `BILL_NOT_FOUND` was already a 404 — no change there.
 * Original code strings are preserved in `details.reason` either way.
 */
import { NotFoundError, DomainRuleError } from "../../core/errors";

export function orderNotFound(id: string): NotFoundError {
  return new NotFoundError("Order", id, { reason: "ORDER_NOT_FOUND" });
}

export function paymentNotFound(id: string): NotFoundError {
  return new NotFoundError("Payment", id, { reason: "PAYMENT_NOT_FOUND" });
}

export function billNotFound(id: string): NotFoundError {
  return new NotFoundError("Bill", id, { reason: "BILL_NOT_FOUND" });
}

export function paymentNotRefundable(): DomainRuleError {
  return new DomainRuleError("Payment is not refundable", {
    reason: "PAYMENT_NOT_REFUNDABLE",
  });
}

export function refundExceedsPaymentAmount(): DomainRuleError {
  return new DomainRuleError("Refund amount exceeds payment amount", {
    reason: "REFUND_AMOUNT_EXCEEDS_PAYMENT",
  });
}

export function paymentExceedsDueAmount(): DomainRuleError {
  return new DomainRuleError("Payment amount exceeds the outstanding balance", {
    reason: "PAYMENT_AMOUNT_EXCEEDS_DUE",
  });
}
