export type RefundResolution =
  | { ok: true }
  | {
      ok: false;
      reason: "PAYMENT_NOT_REFUNDABLE" | "REFUND_AMOUNT_EXCEEDS_PAYMENT";
    };

export const resolveRefundEligibility = (
  paymentStatus: string,
  paymentAmount: number,
  requestedAmount: number,
): RefundResolution => {
  if (paymentStatus !== "SUCCESS")
    return { ok: false, reason: "PAYMENT_NOT_REFUNDABLE" };
  if (requestedAmount > paymentAmount)
    return { ok: false, reason: "REFUND_AMOUNT_EXCEEDS_PAYMENT" };
  return { ok: true };
};
