import { and, asc, eq } from "drizzle-orm";
import { db } from "../../../db";
import { menuSchedules, menus } from "../../../db/schema";
import { compact } from "../../../lib/object-utils";

export const menuRepository = {
  async list(tenantId: string) {
    return db.query.menus.findMany({
      where: eq(menus.tenantId, tenantId),
      orderBy: [asc(menus.name)],
    });
  },
  async listActive(tenantId: string, branchId: string, channel: "STAFF" | "CUSTOMER_QR", fulfillmentType: "DINE_IN" | "TAKEAWAY" | "DELIVERY" | "ONLINE") {
    const { menuResolver } = await import("./menu-resolver.service");
    return menuResolver.getActiveMenus(tenantId, branchId, channel, fulfillmentType, new Date());
  },

  async findById(tenantId: string, id: string) {
    return db.query.menus.findFirst({
      where: and(eq(menus.tenantId, tenantId), eq(menus.id, id)),
    });
  },

  async create(data: {
    tenantId: string;
    name: string;
    description?: string | undefined;
  }) {
    const [created] = await db
      .insert(menus)
      .values(compact(data) as typeof menus.$inferInsert)
      .returning();
    return created!;
  },

  async update(
    tenantId: string,
    id: string,
    data: {
      name?: string | undefined;
      description?: string | null | undefined;
      status?: "DRAFT" | "PUBLISHED" | undefined;
      availableChannels?: string[] | null | undefined;
      availableFulfillmentTypes?: string[] | null | undefined;
      availableBranchIds?: string[] | null | undefined;
      effectiveFrom?: Date | null | undefined;
    },
  ) {
    const [updated] = await db
      .update(menus)
      .set(compact({ ...data, updatedAt: new Date() }))
      .where(and(eq(menus.tenantId, tenantId), eq(menus.id, id)))
      .returning();
    return updated;
  },

  async remove(tenantId: string, id: string) {
    const [removed] = await db
      .delete(menus)
      .where(and(eq(menus.tenantId, tenantId), eq(menus.id, id)))
      .returning({ id: menus.id });
    return removed;
  },
  async listSchedules(tenantId: string, menuId: string) {
    return db.query.menuSchedules.findMany({ where: and(eq(menuSchedules.tenantId, tenantId), eq(menuSchedules.menuId, menuId)) });
  },
  async createSchedule(data: typeof menuSchedules.$inferInsert) {
    const [created] = await db.insert(menuSchedules).values(data).returning();
    return created!;
  },
  async deleteSchedule(tenantId: string, id: string) {
    await db.delete(menuSchedules).where(and(eq(menuSchedules.tenantId, tenantId), eq(menuSchedules.id, id)));
  },
};
