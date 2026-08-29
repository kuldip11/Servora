/** Analytics service — tenant/branch scoped operational dashboard snapshot. */
import type { AuthContext } from "../../core/auth";
import { analyticsRepository } from "./analytics.repository";
import {
  assertAnalyticsScope,
  requireAnalyticsPermission,
} from "./analytics-authorization";

function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export const analyticsService = {
  async getDashboard(auth: AuthContext) {
    requireAnalyticsPermission(auth, "analytics:read");
    assertAnalyticsScope(auth);

    const since = startOfToday();
    const branchId = auth.branchId;

    const [
      totalOrdersToday,
      revenueToday,
      activeOrders,
      inventoryItems,
      topItems,
      revenueByHour,
      paidOrdersToday,
      cancelledOrdersToday,
    ] = await Promise.all([
      analyticsRepository.countOrdersSince(auth.tenantId, branchId, since),
      analyticsRepository.sumPaidRevenueSince(auth.tenantId, branchId, since),
      analyticsRepository.countActiveOrders(auth.tenantId, branchId),
      analyticsRepository.findActiveInventoryItems(auth.tenantId, branchId),
      analyticsRepository.findTopItems(auth.tenantId, branchId, since),
      analyticsRepository.revenueByHour(auth.tenantId, branchId, since),
      analyticsRepository.countPaidOrdersSince(auth.tenantId, branchId, since),
      analyticsRepository.countCancelledOrdersSince(
        auth.tenantId,
        branchId,
        since,
      ),
    ]);

    const lowStockAlerts = inventoryItems.filter(
      (item) => parseFloat(item.currentStock) <= parseFloat(item.minimumStock),
    ).length;

    return {
      totalOrdersToday,
      revenueToday,
      activeOrders,
      lowStockAlerts,
      topItems,
      revenueByHour,
      paidOrdersToday,
      cancelledOrdersToday,
      averageOrderValue:
        paidOrdersToday > 0 ? revenueToday / paidOrdersToday : 0,
    };
  },
};
