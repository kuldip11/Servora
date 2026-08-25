import type { AuthContext } from '../../core/auth';
import { successResponse } from '../../core/response';
import { analyticsService } from './analytics.service';

export const analyticsController = {
  async getDashboard(auth: AuthContext) {
    const dashboard = await analyticsService.getDashboard(auth);
    return successResponse(dashboard);
  },
};
