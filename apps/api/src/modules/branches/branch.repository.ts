import { eq, and, notInArray, inArray, sql } from "drizzle-orm";
import type { OrderType } from "@pos/types";
import { db } from "@/db";
import { branches, customerSessions, orders } from "@/db/schema";
import { compact } from "@/lib/object-utils";

export type BranchCapabilities = {
  dineInEnabled: boolean;
  takeawayEnabled: boolean;
  deliveryEnabled: boolean;
  onlineEnabled: boolean;
  tablesEnabled: boolean;
};

export const branchRepository = {
  async findMany(
    tenantId: string,
    branchId?: string | null | undefined,
    authorizedBranchIds?: string[],
  ) {
    return db.query.branches.findMany({
      where: and(
        eq(branches.tenantId, tenantId),
        eq(branches.isActive, true),
        branchId
          ? eq(branches.id, branchId)
          : authorizedBranchIds?.length
            ? inArray(branches.id, authorizedBranchIds)
            : undefined,
      ),
      orderBy: branches.createdAt,
    });
  },

  async findByCode(tenantId: string, code: string) {
    return db.query.branches.findFirst({
      where: and(eq(branches.tenantId, tenantId), eq(branches.code, code)),
    });
  },

  async findById(tenantId: string, id: string) {
    return db.query.branches.findFirst({
      where: and(eq(branches.id, id), eq(branches.tenantId, tenantId)),
    });
  },

  async countActive(tenantId: string) {
    const active = await db.query.branches.findMany({
      where: and(eq(branches.tenantId, tenantId), eq(branches.isActive, true)),
      columns: { id: true },
    });
    return active.length;
  },

  async create(data: typeof branches.$inferInsert) {
    const [branch] = await db
      .insert(branches)
      .values(
        compact({
          tenantId: data.tenantId,
          name: data.name,
          code: data.code,
          timezone: data.timezone,
          currency: data.currency,
          address: data.address ?? data.addressLine1 ?? "",
          phone: data.phone,
          dineInEnabled: data.dineInEnabled ?? true,
          takeawayEnabled: data.takeawayEnabled ?? true,
          deliveryEnabled: data.deliveryEnabled ?? true,
          onlineEnabled: data.onlineEnabled ?? true,
          tablesEnabled: data.tablesEnabled ?? true,
          addressLine1: data.addressLine1,
          addressLine2: data.addressLine2,
          city: data.city,
          stateProvince: data.stateProvince,
          postalCode: data.postalCode,
          country: data.country,
          managerName: data.managerName,
          email: data.email,
          openingTime: data.openingTime,
          closingTime: data.closingTime,
          weeklyOperatingDays: data.weeklyOperatingDays,
          taxOverride: data.taxOverride,
          serviceChargeOverride: data.serviceChargeOverride,
          invoicePrefix: data.invoicePrefix,
          receiptFooter: data.receiptFooter,
          inventoryTrackingEnabled: data.inventoryTrackingEnabled ?? true,
          negativeStockPolicy: data.negativeStockPolicy ?? "BLOCK",
          customerQrEnabled: data.customerQrEnabled ?? true,
          kdsEnabled: data.kdsEnabled ?? true,
          waiterAppEnabled: data.waiterAppEnabled ?? true,
        }) as typeof branches.$inferInsert,
      )
      .returning();
    return branch!;
  },

  async regenerateTakeawayQr(tenantId: string, id: string) {
    return db.transaction(async (tx) => {
      const now = new Date();
      const [regenerated] = await tx
        .update(branches)
        .set({
          publicTakeawayQrToken: sql`gen_random_uuid()`,
          updatedAt: now,
        })
        .where(and(eq(branches.id, id), eq(branches.tenantId, tenantId)))
        .returning();
      if (regenerated) {
        await tx
          .update(customerSessions)
          .set({ active: false, updatedAt: now })
          .where(
            and(
              eq(customerSessions.tenantId, tenantId),
              eq(customerSessions.branchId, id),
              eq(customerSessions.mode, "TAKEAWAY"),
              eq(customerSessions.active, true),
            ),
          );
      }
      return regenerated;
    });
  },

  async update(
    tenantId: string,
    id: string,
    data: Partial<typeof branches.$inferInsert>,
  ) {
    const [updated] = await db
      .update(branches)
      .set(compact({ ...data, updatedAt: new Date() }))
      .where(and(eq(branches.id, id), eq(branches.tenantId, tenantId)))
      .returning();
    return updated;
  },

  async hasOpenOrders(tenantId: string, branchId: string) {
    const openOrder = await db.query.orders.findFirst({
      where: and(
        eq(orders.tenantId, tenantId),
        eq(orders.branchId, branchId),
        notInArray(orders.status, ["PAID", "CLOSED", "CANCELLED"]),
      ),
      columns: { id: true },
    });
    return !!openOrder;
  },

  async hasOpenOrdersOfType(
    tenantId: string,
    branchId: string,
    type: OrderType,
  ) {
    const openOrder = await db.query.orders.findFirst({
      where: and(
        eq(orders.tenantId, tenantId),
        eq(orders.branchId, branchId),
        eq(orders.type, type),
        notInArray(orders.status, ["PAID", "CLOSED", "CANCELLED"]),
      ),
      columns: { id: true },
    });
    return !!openOrder;
  },
};
