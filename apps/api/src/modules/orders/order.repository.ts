/**
 * Order repository — data access only. No business rules (branch/table
 * validation, transition enforcement, pricing — all in `order.service.ts`
 * and the extracted `order-status.machine.ts` / `order-pricing.ts`).
 */
import { eq, and, desc, asc, sql } from "drizzle-orm";
import type { OrderStatus, OrderType } from "@pos/types";
import { db } from "../../db";
import {
  orders,
  orderItems,
  orderStatusHistory,
  orderItemModifiers,
  kitchenTickets,
} from "../../db/schema";
import type { ResolvedOrderItem } from "./order-pricing";
import { compact } from "../../lib/object-utils";

export const orderRepository = {
  async create(data: {
    tenantId: string;
    branchId: string;
    tableId?: string | undefined;
    createdBy?: string | null;
    source?: "STAFF" | "CUSTOMER_QR";
    customerSessionId?: string | null;
    type: OrderType;
    notes?: string | undefined;
    items: ResolvedOrderItem[];
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    initialTicketStatus?: "PENDING_PAYMENT" | "FIRED";
    customerRequestId?: string | null;
  }) {
    return db.transaction(async (tx) => {
      const [order] = await tx
        .insert(orders)
        .values(
          compact({
            tenantId: data.tenantId,
            branchId: data.branchId,
            tableId: data.tableId,
            createdBy: data.createdBy ?? null,
            source: data.source ?? "STAFF",
            customerSessionId: data.customerSessionId ?? null,
            type: data.type,
            notes: data.notes,
            subtotal: data.subtotal.toFixed(2),
            taxAmount: data.taxAmount.toFixed(2),
            totalAmount: data.totalAmount.toFixed(2),
          }) as typeof orders.$inferInsert,
        )
        .returning();

      // First round always fires immediately as ticket #1.
      const [ticket] = await tx
        .insert(kitchenTickets)
        .values(
          compact({
            tenantId: data.tenantId,
            branchId: data.branchId,
            orderId: order!.id,
            ticketNumber: 1,
            notes: data.notes,
            status: data.initialTicketStatus ?? "FIRED",
            customerRequestId: data.customerRequestId ?? null,
          }) as typeof kitchenTickets.$inferInsert,
        )
        .returning();

      const insertedItems = await tx
        .insert(orderItems)
        .values(
          data.items.map((item) =>
            compact({
              orderId: order!.id,
              kitchenTicketId: ticket!.id,
              menuItemId: item.menuItemId,
              menuItemName: item.menuItemName,
              variantId: item.variantId,
              variantName: item.variantName,
              quantity: item.quantity,
              unitPrice: item.unitPrice.toFixed(2),
              subtotal: item.subtotal.toFixed(2),
              chefNotes: item.chefNotes,
              fulfillmentType: item.fulfillmentType,
            }),
          ) as (typeof orderItems.$inferInsert)[],
        )
        .returning();

      for (const [idx, item] of data.items.entries()) {
        if (item.modifiers?.length) {
          await tx.insert(orderItemModifiers).values(
            item.modifiers.map((mod) => ({
              orderItemId: insertedItems[idx]!.id,
              modifierId: mod.modifierId,
              modifierGroupName: mod.modifierGroupName,
              name: mod.name,
              price: mod.price.toFixed(2),
              quantity: mod.quantity ?? 1,
            })),
          );
        }
      }

      await tx.insert(orderStatusHistory).values({
        orderId: order!.id,
        newStatus: "OPEN",
        changedBy: data.createdBy ?? null,
      });

      return order!;
    });
  },

  async findById(tenantId: string, orderId: string) {
    return db.query.orders.findFirst({
      where: and(eq(orders.id, orderId), eq(orders.tenantId, tenantId)),
      with: {
        items: { with: { modifiers: true } },
        kitchenTickets: {
          with: { items: { with: { modifiers: true } } },
          orderBy: asc(kitchenTickets.ticketNumber),
        },
        statusHistory: { orderBy: desc(orderStatusHistory.changedAt) },
        table: true,
        createdByUser: true,
        bill: true,
        payments: true,
      },
    });
  },

  async findMany(
    tenantId: string,
    branchId: string | null | undefined,
    filters?: { status?: string | undefined; type?: string | undefined },
  ) {
    return db.query.orders.findMany({
      where: and(
        eq(orders.tenantId, tenantId),
        branchId ? eq(orders.branchId, branchId) : undefined,
        filters?.status
          ? eq(orders.status, filters.status as OrderStatus)
          : undefined,
        filters?.type ? eq(orders.type, filters.type as OrderType) : undefined,
      ),
      with: {
        items: true,
        kitchenTickets: {
          columns: { id: true, status: true, ticketNumber: true },
        },
        table: true,
        createdByUser: true,
        payments: true,
      },
      orderBy: desc(orders.createdAt),
    });
  },

  async updateStatus(
    tenantId: string,
    orderId: string,
    newStatus: OrderStatus,
    changedBy: string,
    reason?: string | undefined,
    branchId?: string | undefined,
  ) {
    return db.transaction(async (tx) => {
      const [current] = await tx
        .select({ status: orders.status })
        .from(orders)
        .where(
          and(
            eq(orders.id, orderId),
            eq(orders.tenantId, tenantId),
            branchId ? eq(orders.branchId, branchId) : undefined,
          ),
        );

      if (!current) return undefined;

      await tx.insert(orderStatusHistory).values(
        compact({
          orderId,
          oldStatus: current.status,
          newStatus,
          changedBy,
          reason,
        }) as typeof orderStatusHistory.$inferInsert,
      );

      const [updated] = await tx
        .update(orders)
        .set({ status: newStatus, updatedAt: new Date() })
        .where(eq(orders.id, orderId))
        .returning();

      return updated;
    });
  },

  // Fires a new round to the kitchen: a brand new ticket, not a re-use of an
  // existing one. This is what "Add More Items" / "Send to Kitchen" does.
  async fireNewTicket(
    tenantId: string,
    branchId: string,
    orderId: string,
    items: ResolvedOrderItem[],
    extraSubtotal: number,
    extraTax: number,
    notes?: string | undefined,
    customerRequestId?: string | null,
  ) {
    return db.transaction(async (tx) => {
      if (customerRequestId) {
        const existingTicket = await tx.query.kitchenTickets.findFirst({
          where: and(
            eq(kitchenTickets.orderId, orderId),
            eq(kitchenTickets.customerRequestId, customerRequestId),
          ),
        });
        if (existingTicket) return existingTicket;
      }
      const [{ maxTicket } = { maxTicket: 0 }] = await tx
        .select({
          maxTicket: sql<number>`coalesce(max(${kitchenTickets.ticketNumber}), 0)`,
        })
        .from(kitchenTickets)
        .where(eq(kitchenTickets.orderId, orderId));

      const [ticket] = await tx
        .insert(kitchenTickets)
        .values(
          compact({
            tenantId,
            branchId,
            orderId,
            ticketNumber: (maxTicket ?? 0) + 1,
            notes,
            customerRequestId: customerRequestId ?? null,
          }) as typeof kitchenTickets.$inferInsert,
        )
        .returning();

      const insertedItems = await tx
        .insert(orderItems)
        .values(
          items.map((item) =>
            compact({
              orderId,
              kitchenTicketId: ticket!.id,
              menuItemId: item.menuItemId,
              menuItemName: item.menuItemName,
              variantId: item.variantId,
              variantName: item.variantName,
              quantity: item.quantity,
              unitPrice: item.unitPrice.toFixed(2),
              subtotal: item.subtotal.toFixed(2),
              chefNotes: item.chefNotes,
              fulfillmentType: item.fulfillmentType,
            }),
          ) as (typeof orderItems.$inferInsert)[],
        )
        .returning();

      for (const [idx, item] of items.entries()) {
        if (item.modifiers?.length) {
          await tx.insert(orderItemModifiers).values(
            item.modifiers.map((mod) => ({
              orderItemId: insertedItems[idx]!.id,
              modifierId: mod.modifierId,
              modifierGroupName: mod.modifierGroupName,
              name: mod.name,
              price: mod.price.toFixed(2),
              quantity: mod.quantity ?? 1,
            })),
          );
        }
      }

      await tx
        .update(orders)
        .set({
          subtotal: sql`${orders.subtotal} + ${extraSubtotal.toFixed(2)}`,
          taxAmount: sql`${orders.taxAmount} + ${extraTax.toFixed(2)}`,
          totalAmount: sql`${orders.totalAmount} + ${(extraSubtotal + extraTax).toFixed(2)}`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(orders.id, orderId),
            eq(orders.tenantId, tenantId),
            eq(orders.branchId, branchId),
          ),
        );

      return ticket!;
    });
  },
};
