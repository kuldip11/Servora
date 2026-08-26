import { apiClient } from "../../../shared/lib/api-client";

export async function fetchCategories(): Promise<any[]> {
  const res = await apiClient.get("/menu/categories");
  return res.data.data;
}
