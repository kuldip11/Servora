import { request } from "../../shared/api/client";

export type CustomerOrder = {
  id: string;
  status: string;
  subtotal: string;
  taxAmount: string;
  totalAmount: string;
  createdAt: string;
  kitchenTickets: Array<{ id: string; ticketNumber: number; status: "FIRED" | "PREPARING" | "READY" | "SERVED" }>;
  payments: Array<{ id: string; method: "CASH" | "CARD" | "UPI" | "RAZORPAY" | "STRIPE"; status: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED"; amount: string; reference: string | null }>;
};

export type CreateCustomerOrderInput = {
  items: Array<{
    menuItemId: string;
    variantId?: string;
    quantity: number;
    chefNotes?: string;
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
