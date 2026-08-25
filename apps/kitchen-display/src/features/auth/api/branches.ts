import { apiClient } from "../../../shared/lib/api-client";
import type { Branch } from "../types";

export async function fetchBranches(): Promise<Branch[]> {
  const res = await apiClient.get("/branches");
  return res.data.data;
}
