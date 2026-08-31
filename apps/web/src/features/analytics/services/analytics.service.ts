import { apiClient } from "../../../shared/lib/api-client";
import type { CostMarginRow, DashboardStats } from "@pos/types";

export const analyticsService = {
  async dashboard(): Promise<DashboardStats> {
    const res = await apiClient.get("/analytics/dashboard");
    return res.data.data;
  },

  async costMargin(categoryId?: string): Promise<CostMarginRow[]> {
    const res = await apiClient.get("/analytics/cost-margin", {
      params: categoryId ? { categoryId } : undefined,
    });
    return res.data.data;
  },
};
