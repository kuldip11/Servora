import { request } from "../../shared/api/client";

export type CustomerRequestType = "CALL_WAITER" | "WATER" | "CUTLERY" | "BILL" | "ASSISTANCE";
export type CustomerRequest = { id: string; type: CustomerRequestType; status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED" | "CANCELLED"; note: string | null; createdAt: string; updatedAt: string };

export function createCustomerRequest(sessionToken: string, type: CustomerRequestType, orderId?: string) {
  return request<CustomerRequest>("/api/customer/requests", { method: "POST", body: JSON.stringify({ type, ...(orderId ? { orderId } : {}) }) }, sessionToken);
}
