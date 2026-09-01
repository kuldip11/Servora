import type { AuthContext } from "@/core/auth";
import { successResponse } from "@/core/response";
import { analyticsService } from "./analytics.service";

export const analyticsController = {
  async getDashboard(auth: AuthContext) {
    const dashboard = await analyticsService.getDashboard(auth);
    return successResponse(dashboard);
  },

  async getCostMarginReport(auth: AuthContext, categoryId?: string) {
    return successResponse(
      await analyticsService.getCostMarginReport(auth, categoryId),
    );
  },
  async getMenuEngineeringReport(auth: AuthContext, windowDays?: string) {
    return successResponse(
      await analyticsService.getMenuEngineeringReport(
        auth,
        windowDays ? Number(windowDays) : 90,
      ),
    );
  },
};
