import { request } from "../../shared/api/client";

export type CustomerOrder = {
  id: string;
  status: string;
  subtotal: string;
  taxAmount: string;
  totalAmount: string;
  createdAt: string;
  items: Array<{ id: string; menuItemId: string; menuItemName: string; variantId: string | null; variantName: string | null; quantity: number; unitPrice: string | number; subtotal: string | number; chefNotes: string | null; fulfillmentType: "DINE_IN" | "TAKEAWAY"; modifiers: Array<{ modifierId: string; modifierGroupName: string | null; name: string; price: string | number; quantity: number }> }>;
  kitchenTickets: Array<{ id: string; ticketNumber: number; status: "PENDING_PAYMENT" | "FIRED" | "PREPARING" | "READY" | "SERVED" }>;
  payments: Array<{ id: string; method: "CASH" | "CARD" | "UPI" | "RAZORPAY" | "STRIPE"; status: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED"; amount: string; reference: string | null }>;
};

export type CreateCustomerOrderInput = {
  items: Array<{
    menuItemId: string;
    variantId?: string;
    quantity: number;
    chefNotes?: string;
    fulfillmentType?: "DINE_IN" | "TAKEAWAY";
    selectedOptions?: Array<{ optionId: string; quantity?: number }>;
  }>;
  notes?: string;
};

export function createCustomerOrder(sessionToken: string, input: CreateCustomerOrderInput) {
  return request<CustomerOrder>("/api/customer/orders", { method: "POST", body: JSON.stringify(input) }, sessionToken);
}

export function getCustomerOrder(sessionToken: string, orderId: string) {
  return request<CustomerOrder>(`/api/customer/orders/${orderId}`, undefined, sessionToken);
}

export type CustomerCheckout = {
  payment: { id: string; method: "CASH"; status: "PENDING"; amount: string; reference: string | null };
  orderStatus: string;
  paymentRequired: boolean;
  method: "CASH";
};

export function checkoutCustomerOrder(sessionToken: string, orderId: string) {
  return request<CustomerCheckout>(`/api/customer/orders/${orderId}/checkout`, {
    method: "POST",
    body: JSON.stringify({ method: "CASH" }),
  }, sessionToken);
}

export type TakeawayPaymentVerification = {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
};

export function verifyTakeawayPayment(sessionToken: string, input: TakeawayPaymentVerification) {
  return request<CustomerOrder>("/api/customer/orders/${input.orderId}/payment/verify", { method: "POST", body: JSON.stringify(input) }, sessionToken);
}
