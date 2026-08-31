import { apiClient } from "../../../shared/lib/api-client";

export interface CollectPaymentInput {
  billId?: string;
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
      billId: input.billId,
      method: input.method,
      amount: input.amount,
      reference: input.reference || undefined,
    });
  },
  async getOrderBills(orderId: string) {
    const response = await apiClient.get(`/orders/${orderId}/bills`);
    return response.data.data;
  },
  async splitOrder(orderId: string, ways: number) {
    const response = await apiClient.post(`/orders/${orderId}/bills/split`, { ways });
    return response.data.data;
  },
  async splitOrderByItems(orderId: string, allocations: Array<{ label: string; orderItemIds: string[] }>) {
    const response = await apiClient.post(`/orders/${orderId}/bills/split-items`, { allocations });
    return response.data.data;
  },
  async splitOrderBySeat(orderId: string, sharedItemStrategy: "EVEN_SPLIT" | "MANUAL") {
    const response = await apiClient.post(`/orders/${orderId}/bills/split-seat`, { sharedItemStrategy });
    return response.data.data as { status: "CREATED"; bills: unknown[] } | { status: "MANUAL_REQUIRED"; allocations: Array<{ label: string; orderItemIds: string[] }>; sharedItemIds: string[] };
  },
};
