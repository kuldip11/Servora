/**
 * Analytics service — assembles the dashboard snapshot. `topItems` and
 * `revenueByHour` are preserved as hardcoded empty arrays, exactly as in
 * the pre-refactor code — they read as "not implemented yet" rather than
 * a real business rule, and filling them in would be a product decision
 * outside this migration's scope (see docs/NEXT_STEPS.md).
 */
import type { AuthContext } from '../../core/auth';
import { analyticsRepository } from './analytics.repository';
import { assertAnalyticsScope, requireAnalyticsPermission } from './analytics-authorization';

function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export const analyticsService = {
  async getDashboard(auth: AuthContext) {
    requireAnalyticsPermission(auth, 'analytics:read');
    assertAnalyticsScope(auth);

    const since = startOfToday();
    const branchId = auth.branchId;

    const [totalOrdersToday, revenueToday, activeOrders, inventoryItems] = await Promise.all([
      analyticsRepository.countOrdersSince(auth.tenantId, branchId, since),
      analyticsRepository.sumPaidRevenueSince(auth.tenantId, branchId, since),
      analyticsRepository.countActiveOrders(auth.tenantId, branchId),
      analyticsRepository.findActiveInventoryItems(auth.tenantId, branchId),
    ]);

    const lowStockAlerts = inventoryItems.filter(
      (item) => parseFloat(item.currentStock) <= parseFloat(item.minimumStock),
    ).length;

    return {
      totalOrdersToday,
      revenueToday,
      activeOrders,
      lowStockAlerts,
      topItems: [] as unknown[],
      revenueByHour: [] as unknown[],
    };
  },
};
