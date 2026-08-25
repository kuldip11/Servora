/**
 * Table repository — data access only. No business rules (see
 * `table.service.ts` for branch/tables-enabled/open-order checks).
 */
import { eq, and, notInArray } from 'drizzle-orm';
import type { TableStatus } from '@pos/types';
import { db } from '../../db';
import { restaurantTables, orders } from '../../db/schema';
import { compact } from '../../lib/object-utils';

export const tableRepository = {
  async findMany(tenantId: string, branchId?: string | null) {
    return db.query.restaurantTables.findMany({
      where: and(
        eq(restaurantTables.tenantId, tenantId),
        eq(restaurantTables.isActive, true),
        branchId ? eq(restaurantTables.branchId, branchId) : undefined,
      ),
      // Only need the branch join in aggregate mode, to group/tag by branch.
      ...(branchId ? {} : { with: { branch: true } }),
      orderBy: restaurantTables.createdAt,
    });
  },

  async findById(tenantId: string, id: string) {
    return db.query.restaurantTables.findFirst({
      where: and(eq(restaurantTables.id, id), eq(restaurantTables.tenantId, tenantId)),
    });
  },

  async create(data: {
    tenantId: string;
    branchId: string;
    name: string;
    capacity?: number | undefined;
    section?: string | undefined;
  }) {
    const [table] = await db
      .insert(restaurantTables)
      .values(compact(data) as typeof restaurantTables.$inferInsert)
      .returning();
    return table!;
  },

  async update(
    tenantId: string,
    id: string,
    data: {
      name?: string | undefined;
      capacity?: number | undefined;
      section?: string | null | undefined;
      status?: TableStatus | undefined;
      isActive?: boolean | undefined;
    },
  ) {
    const [updated] = await db
      .update(restaurantTables)
      .set(compact({ ...data, updatedAt: new Date() }))
      .where(and(eq(restaurantTables.id, id), eq(restaurantTables.tenantId, tenantId)))
      .returning();
    return updated;
  },

  async softDelete(tenantId: string, id: string) {
    const [updated] = await db
      .update(restaurantTables)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(restaurantTables.id, id), eq(restaurantTables.tenantId, tenantId)))
      .returning();
    return updated;
  },

  // Used to block deleting/deactivating a table that has an active (unclosed) order on it.
  async hasOpenOrders(tenantId: string, tableId: string) {
    const openOrder = await db.query.orders.findFirst({
      where: and(
        eq(orders.tenantId, tenantId),
        eq(orders.tableId, tableId),
        notInArray(orders.status, ['PAID', 'CLOSED', 'CANCELLED']),
      ),
      columns: { id: true },
    });
    return !!openOrder;
  },
};
