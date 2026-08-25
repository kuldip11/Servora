import { apiClient } from "../../../shared/lib/api-client";

export interface CollectPaymentInput {
  method: string;
  amount: number;
  reference?: string;
}

export const billingService = {
  /**
   * Records the payment, then moves the tab to PAID so it drops off the
   * billing queue and (for dine-in) the table frees up. Two calls, but
   * one user-facing action — kept together here so callers can't record
   * a payment without also advancing order status.
   */
  async collectPayment(
    orderId: string,
    input: CollectPaymentInput,
  ): Promise<void> {
    await apiClient.post("/payments", {
      orderId,
      method: input.method,
      amount: input.amount,
      reference: input.reference || undefined,
    });
    await apiClient.patch(`/orders/${orderId}/status`, { status: "PAID" });
  },
};
