import { request } from "../../shared/api/client";

export type CustomerSession = {
  sessionToken: string;
  expiresAt: string;
  restaurant: { id: string; name: string };
  table: { id: string; name: string; section: string | null };
};

export function createCustomerSession(qrToken: string) {
  return request<CustomerSession>("/api/customer/sessions", {
    method: "POST",
    body: JSON.stringify({ qrToken }),
  });
}
