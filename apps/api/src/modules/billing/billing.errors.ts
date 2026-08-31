
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

export function billSelectionRequired(): DomainRuleError {
  return new DomainRuleError("Select a bill before recording payment", { reason: "BILL_REQUIRED" });
}

export function splitBillNotAllowed(reason: "BILL_ALREADY_PAID" | "TOO_MANY_BILLS"): DomainRuleError {
  return new DomainRuleError(
    reason === "BILL_ALREADY_PAID" ? "A paid order cannot be split" : "Each split bill must contain an active item",
    { reason },
  );
}

export function invalidBillAllocation(reason: string): DomainRuleError {
  const messages: Record<string, string> = {
    EMPTY_BILL: "Every bill must contain at least one active item",
    UNKNOWN_ITEM: "The allocation contains an item that is not active on this order",
    DUPLICATE_ITEM: "An active item cannot be assigned to more than one bill",
    UNASSIGNED_ITEM: "Every active item must be assigned to exactly one bill",
    NO_SEAT_LABELS: "Add a seat or diner label to at least one active item before splitting by seat",
    SPLIT_COMBO_GROUP: "A combo and all of its component items must stay on the same bill",
  };
  return new DomainRuleError(messages[reason] ?? "The item allocation is invalid", { reason });
}
