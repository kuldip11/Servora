/**
 * Analytics repository — data access only. Read-only aggregates for the
 * dashboard; no writes, no cross-module side effects.
 */
import { eq, and, gte, count, sum, notInArray } from "drizzle-orm";
import { db } from "../../db";
import { orders, inventoryItems } from "../../db/schema";

// Tabs that are still "in flight" — not yet paid, closed, or cancelled.
// Kept as a named constant rather than inline so the definition of
// "active" lives in exactly one place.
const ACTIVE_ORDER_EXCLUDED_STATUSES = ["PAID", "CLOSED", "CANCELLED"] as const;

export const analyticsRepository = {
  async countOrdersSince(
    tenantId: string,
    branchId: string | null,
    since: Date,
  ) {
    const [result] = await db
      .select({ count: count() })
      .from(orders)
      .where(
        and(
          eq(orders.tenantId, tenantId),
          branchId ? eq(orders.branchId, branchId) : undefined,
          gte(orders.createdAt, since),
        ),
      );
    return result?.count ?? 0;
  },

  async sumPaidRevenueSince(
    tenantId: string,
    branchId: string | null,
    since: Date,
  ) {
    const [result] = await db
      .select({ total: sum(orders.totalAmount) })
      .from(orders)
      .where(
        and(
          eq(orders.tenantId, tenantId),
          branchId ? eq(orders.branchId, branchId) : undefined,
          gte(orders.createdAt, since),
          eq(orders.status, "PAID"),
        ),
      );
    return parseFloat(result?.total ?? "0");
  },

  async countActiveOrders(tenantId: string, branchId: string | null) {
    const [result] = await db
      .select({ count: count() })
      .from(orders)
      .where(
        and(
          eq(orders.tenantId, tenantId),
          branchId ? eq(orders.branchId, branchId) : undefined,
          notInArray(orders.status, [...ACTIVE_ORDER_EXCLUDED_STATUSES]),
        ),
      );
    return result?.count ?? 0;
  },

  async findActiveInventoryItems(tenantId: string, branchId: string | null) {
    return db.query.inventoryItems.findMany({
      where: and(
        eq(inventoryItems.tenantId, tenantId),
        branchId ? eq(inventoryItems.branchId, branchId) : undefined,
        eq(inventoryItems.isActive, true),
      ),
    });
  },
};
