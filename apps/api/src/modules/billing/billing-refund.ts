/**
 * Pure refund-eligibility check — extracted from the two inline `if`
 * checks that used to live directly in the repository's
 * `createRefund` transaction, same DB-free-extraction pattern as
 * `orders/order-pricing.ts`, `kitchen-tickets/ticket-status.machine.ts`,
 * and `inventory/inventory-stock.ts`. No behavior change.
 */
export type RefundResolution =
  | { ok: true }
  | {
      ok: false;
      reason: "PAYMENT_NOT_REFUNDABLE" | "REFUND_AMOUNT_EXCEEDS_PAYMENT";
    };

export function resolveRefundEligibility(
  paymentStatus: string,
  paymentAmount: number,
  requestedAmount: number,
): RefundResolution {
  if (paymentStatus !== "SUCCESS")
    return { ok: false, reason: "PAYMENT_NOT_REFUNDABLE" };
  if (requestedAmount > paymentAmount)
    return { ok: false, reason: "REFUND_AMOUNT_EXCEEDS_PAYMENT" };
  return { ok: true };
}
