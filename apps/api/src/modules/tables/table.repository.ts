/**
 * Table repository — data access only. No business rules (see
 * `table.service.ts` for branch/tables-enabled/open-order checks).
 */
import { eq, and, notInArray } from "drizzle-orm";
import type { TableStatus } from "@pos/types";
import { db } from "../../db";
import { ConflictError } from "../../core/errors";
import {
  restaurantTables,
  orders,
  customerSessions,
  orderStatusHistory,
} from "../../db/schema";
import { compact } from "../../lib/object-utils";

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
      where: and(
        eq(restaurantTables.id, id),
        eq(restaurantTables.tenantId, tenantId),
      ),
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

  async regenerateQrToken(tenantId: string, id: string) {
    const [updated] = await db
      .update(restaurantTables)
      .set({ publicQrToken: crypto.randomUUID(), updatedAt: new Date() })
      .where(
        and(
          eq(restaurantTables.id, id),
          eq(restaurantTables.tenantId, tenantId),
        ),
      )
      .returning();
    return updated;
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
      .where(
        and(
          eq(restaurantTables.id, id),
          eq(restaurantTables.tenantId, tenantId),
        ),
      )
      .returning();
    return updated;
  },

  async softDelete(tenantId: string, id: string) {
    const [updated] = await db
      .update(restaurantTables)
      .set({ isActive: false, updatedAt: new Date() })
      .where(
        and(
          eq(restaurantTables.id, id),
          eq(restaurantTables.tenantId, tenantId),
        ),
      )
      .returning();
    return updated;
  },

  // Used to block deleting/deactivating a table that has an active (unclosed) order on it.
  async hasOpenOrders(tenantId: string, tableId: string) {
    const openOrder = await db.query.orders.findFirst({
      where: and(
        eq(orders.tenantId, tenantId),
        eq(orders.tableId, tableId),
        notInArray(orders.status, ["PAID", "CLOSED", "CANCELLED"]),
      ),
      columns: { id: true },
    });
    return !!openOrder;
  },

  async transferOrderTable(input: {
    tenantId: string;
    branchId: string;
    orderId: string;
    oldTableId: string;
    newTableId: string;
    customerSessionId?: string | null;
    changedBy: string;
    oldTableName: string;
    newTableName: string;
    reason?: string;
  }) {
    return db.transaction(async (tx) => {
      // The status predicate is the concurrency guard: only one transaction
      // can claim an AVAILABLE destination. A competing transfer gets no row.
      const [newTable] = await tx
        .update(restaurantTables)
        .set({ status: "OCCUPIED", updatedAt: new Date() })
        .where(and(
          eq(restaurantTables.id, input.newTableId),
          eq(restaurantTables.tenantId, input.tenantId),
          eq(restaurantTables.branchId, input.branchId),
          eq(restaurantTables.status, "AVAILABLE"),
          eq(restaurantTables.isActive, true),
        ))
        .returning();
      if (!newTable) return undefined;

      const [oldTable] = await tx
        .update(restaurantTables)
        .set({ status: "AVAILABLE", updatedAt: new Date() })
        .where(and(
          eq(restaurantTables.id, input.oldTableId),
          eq(restaurantTables.tenantId, input.tenantId),
          eq(restaurantTables.branchId, input.branchId),
        ))
        .returning();

      const [order] = await tx
        .update(orders)
        .set({ tableId: input.newTableId, updatedAt: new Date() })
        .where(and(
          eq(orders.id, input.orderId),
          eq(orders.tenantId, input.tenantId),
          eq(orders.branchId, input.branchId),
          eq(orders.status, "OPEN"),
          eq(orders.tableId, input.oldTableId),
        ))
        .returning();
      if (!order || !oldTable) {
        throw new ConflictError("The order table changed while the transfer was being committed", {
          reason: "ORDER_TABLE_TRANSFER_CONFLICT",
        });
      }

      if (input.customerSessionId) {
        await tx.update(customerSessions)
          .set({ tableId: input.newTableId, updatedAt: new Date() })
          .where(and(
            eq(customerSessions.id, input.customerSessionId),
            eq(customerSessions.tenantId, input.tenantId),
          ));
      }

      await tx.insert(orderStatusHistory).values({
        orderId: input.orderId,
        oldStatus: "OPEN",
        newStatus: "OPEN",
        changedBy: input.changedBy,
        reason: `Table transfer: ${input.oldTableName} → ${input.newTableName}${input.reason?.trim() ? ` · ${input.reason.trim()}` : ""}`,
      });
      return { order, oldTable, newTable };
    });
  },
};
