/**
 * Analytics repository — data access only. Read-only aggregates for the
 * dashboard; no writes, no cross-module side effects.
 */
import { eq, and, gte, count, sum, notInArray, desc, sql } from "drizzle-orm";
import { db } from "../../db";
import { orders, inventoryItems, orderItems } from "../../db/schema";

// Tabs that are still "in flight" — not yet paid, closed, or cancelled.
// Kept as a named constant rather than inline so the definition of
// "active" lives in exactly one place.
const ACTIVE_ORDER_EXCLUDED_STATUSES = ["PAID", "CLOSED", "CANCELLED"] as const;

export const analyticsRepository = {
  async countPaidOrdersSince(
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
          eq(orders.status, "PAID"),
        ),
      );
    return result?.count ?? 0;
  },

  async countCancelledOrdersSince(
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
          eq(orders.status, "CANCELLED"),
        ),
      );
    return result?.count ?? 0;
  },

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

  async findTopItems(tenantId: string, branchId: string | null, since: Date) {
    const rows = await db
      .select({
        name: orderItems.menuItemName,
        count: sum(orderItems.quantity),
        revenue: sum(orderItems.subtotal),
      })
      .from(orderItems)
      .innerJoin(orders, eq(orders.id, orderItems.orderId))
      .where(
        and(
          eq(orders.tenantId, tenantId),
          branchId ? eq(orders.branchId, branchId) : undefined,
          gte(orders.createdAt, since),
          notInArray(orders.status, ["CANCELLED"]),
        ),
      )
      .groupBy(orderItems.menuItemName)
      .orderBy(desc(sum(orderItems.quantity)))
      .limit(5);

    return rows.map((row) => ({
      name: row.name,
      count: Number(row.count ?? 0),
      revenue: parseFloat(row.revenue ?? "0"),
    }));
  },

  async revenueByHour(tenantId: string, branchId: string | null, since: Date) {
    const rows = await db
      .select({
        hour: sql<number>`extract(hour from ${orders.createdAt})`,
        revenue: sum(orders.totalAmount),
      })
      .from(orders)
      .where(
        and(
          eq(orders.tenantId, tenantId),
          branchId ? eq(orders.branchId, branchId) : undefined,
          gte(orders.createdAt, since),
          eq(orders.status, "PAID"),
        ),
      )
      .groupBy(sql`extract(hour from ${orders.createdAt})`)
      .orderBy(sql`extract(hour from ${orders.createdAt})`);

    return rows.map((row) => ({
      hour: Number(row.hour),
      revenue: parseFloat(row.revenue ?? "0"),
    }));
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
