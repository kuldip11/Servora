import { request } from "@/shared/api/client";

export type CustomerSession = {
  sessionToken: string;
  expiresAt: string;
  restaurant: { id: string; name: string };
  mode: "DINE_IN" | "TAKEAWAY";
  table: { id: string; name: string; section: string | null } | null;
};

export const createCustomerSession = (qrToken: string) => {
  return request<CustomerSession>("/api/customer/sessions", {
    method: "POST",
    body: JSON.stringify({ qrToken }),
  });
};
