import { apiClient } from "../../../shared/lib/api-client";

export async function searchCustomers(query: string): Promise<any[]> {
  const res = await apiClient.get("/customers", { params: { search: query } });
  return res.data.data;
}
