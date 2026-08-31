import { apiClient } from "../../../shared/lib/api-client";
import type { RestaurantTable } from "@pos/types";

export async function fetchTables(): Promise<RestaurantTable[]> {
  const res = await apiClient.get("/tables");
  return res.data.data;
}
