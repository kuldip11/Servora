import { apiClient } from "../../../shared/lib/api-client";
import type { LoyaltyCustomer } from "@pos/types";

export async function searchCustomers(query: string): Promise<LoyaltyCustomer[]> {
  const res = await apiClient.get("/loyalty/customers");
  const needle = query.trim().toLowerCase();
  return (res.data.data as LoyaltyCustomer[]).filter((customer) =>
    [customer.name, customer.phone, customer.email].some((value) => String(value ?? "").toLowerCase().includes(needle)),
  ).slice(0, 20);
}
