import { createAnalyticsApi } from "@pos/api-client";
import { apiClient } from "../../../shared/lib/api-client";

const analyticsApi = createAnalyticsApi(apiClient);
import type { CostMarginRow, DashboardStats } from "@pos/types";

export const analyticsService = {
  async dashboard(): Promise<DashboardStats> {
    return analyticsApi.dashboard<DashboardStats>();
  },

  async costMargin(categoryId?: string): Promise<CostMarginRow[]> {
    return analyticsApi.costMargin<CostMarginRow[]>(categoryId ? { categoryId } : {});
  },
};
