import { apiClient } from "../../../shared/lib/api-client";
import type { DashboardStats } from "@pos/types";

export const analyticsService = {
  async dashboard(): Promise<DashboardStats> {
    const res = await apiClient.get("/analytics/dashboard");
    return res.data.data;
  },
};
