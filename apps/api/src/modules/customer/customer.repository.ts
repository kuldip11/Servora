import { and, eq, isNull, or, notInArray } from "drizzle-orm";
import { db } from "../../db";
import { branches, customerSessions, menuCategories, menuItems, restaurantTables, orders, kitchenTickets } from "../../db/schema";

export const customerRepository = {
  async findBranchByTakeawayQrToken(token: string) {
    return db.query.branches.findFirst({
      where: and(eq(branches.publicTakeawayQrToken, token), eq(branches.isActive, true)),
    });
  },

  async findTableByQrToken(token: string) {
    return db.query.restaurantTables.findFirst({
      where: and(eq(restaurantTables.publicQrToken, token), eq(restaurantTables.isActive, true)),
      with: { branch: true },
    });
  },

  async findCustomerRequestTicket(orderId: string, customerRequestId: string) {
    return db.query.kitchenTickets.findFirst({
      where: and(eq(kitchenTickets.orderId, orderId), eq(kitchenTickets.customerRequestId, customerRequestId)),
      columns: { id: true },
    });
  },

  async findOpenOrderBySession(tenantId: string, branchId: string, sessionId: string) {
    return db.query.orders.findFirst({
      where: and(
        eq(orders.tenantId, tenantId),
        eq(orders.branchId, branchId),
        eq(orders.customerSessionId, sessionId),
        notInArray(orders.status, ["PAID", "CLOSED", "CANCELLED"]),
      ),
      columns: { id: true, status: true },
    });
  },

  async createSession(data: { tenantId: string; branchId: string; tableId?: string | null; mode: "DINE_IN" | "TAKEAWAY"; expiresAt: Date }) {
    const [session] = await db.insert(customerSessions).values(data).returning();
    return session!;
  },

  async findSession(token: string) {
    return db.query.customerSessions.findFirst({
      where: and(eq(customerSessions.token, token), eq(customerSessions.active, true)),
      with: { table: true, branch: true },
    });
  },

  async listMenu(tenantId: string, branchId: string) {
    const categories = await db.query.menuCategories.findMany({
      where: and(eq(menuCategories.tenantId, tenantId), eq(menuCategories.isActive, true), or(eq(menuCategories.branchId, branchId), isNull(menuCategories.branchId))),
      orderBy: (t, { asc }) => [asc(t.sortOrder), asc(t.name)],
    });

    const items = await db.query.menuItems.findMany({
      where: and(
        eq(menuItems.tenantId, tenantId),
        eq(menuItems.isPublished, true),
        eq(menuItems.isAvailable, true),
        or(eq(menuItems.branchId, branchId), isNull(menuItems.branchId)),
        isNull(menuItems.deletedAt),
      ),
      with: {
        variants: true,
        modifierGroupLinks: { with: { group: { with: { options: true } } } },
        tagLinks: { with: { tag: true } },
        allergenLinks: { with: { allergen: true } },
        images: true,
      },
      orderBy: (t, { asc }) => [asc(t.sortOrder), asc(t.name)],
    });

    return { categories, items };
  },
};
