import { apiClient } from "../../../shared/lib/api-client";

export interface CollectPaymentInput {
  method: string;
  amount: number;
  reference?: string;
}

export const billingService = {
  async collectPayment(
    orderId: string,
    input: CollectPaymentInput,
  ): Promise<void> {
    // The API records the payment and atomically advances BILL_REQUESTED -> PAID
    // once cumulative successful payments cover the bill. Keeping this as one
    // API operation prevents double transitions and stale UI races.
    await apiClient.post("/payments", {
      orderId,
      method: input.method,
      amount: input.amount,
      reference: input.reference || undefined,
    });
  },
};
