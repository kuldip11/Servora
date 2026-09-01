import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { menuCategories, menuItems, menuMemberships, menus } from "@/db/schema";

export const membershipRepository = {
  async listForItem(tenantId: string, menuItemId: string) {
    return db.query.menuMemberships
      .findMany({
        where: eq(menuMemberships.menuItemId, menuItemId),
        with: {
          menu: true,
          category: true,
          item: { columns: { tenantId: true } },
        },
      })
      .then((rows) => rows.filter((row) => row.item.tenantId === tenantId));
  },

  async listItems(tenantId: string, menuId: string) {
    return db.query.menuMemberships
      .findMany({
        where: eq(menuMemberships.menuId, menuId),
        orderBy: [asc(menuMemberships.sortOrder)],
        with: { menu: true, category: true, item: true },
      })
      .then((rows) => rows.filter((row) => row.menu.tenantId === tenantId));
  },

  async findResources(
    tenantId: string,
    menuId: string,
    itemId: string,
    categoryId: string,
  ) {
    const [menu, item, category] = await Promise.all([
      db.query.menus.findFirst({
        where: and(eq(menus.id, menuId), eq(menus.tenantId, tenantId)),
      }),
      db.query.menuItems.findFirst({
        where: and(eq(menuItems.id, itemId), eq(menuItems.tenantId, tenantId)),
      }),
      db.query.menuCategories.findFirst({
        where: and(
          eq(menuCategories.id, categoryId),
          eq(menuCategories.tenantId, tenantId),
        ),
      }),
    ]);
    return { menu, item, category };
  },

  async upsert(data: {
    menuId: string;
    menuItemId: string;
    categoryId: string;
    sortOrder: number;
  }) {
    const [membership] = await db
      .insert(menuMemberships)
      .values(data)
      .onConflictDoUpdate({
        target: [menuMemberships.menuId, menuMemberships.menuItemId],
        set: {
          categoryId: data.categoryId,
          sortOrder: data.sortOrder,
          updatedAt: new Date(),
        },
      })
      .returning();
    return membership!;
  },

  async remove(tenantId: string, menuItemId: string, menuId: string) {
    const [item, menu] = await Promise.all([
      db.query.menuItems.findFirst({
        where: and(
          eq(menuItems.id, menuItemId),
          eq(menuItems.tenantId, tenantId),
        ),
        columns: { id: true },
      }),
      db.query.menus.findFirst({
        where: and(eq(menus.id, menuId), eq(menus.tenantId, tenantId)),
        columns: { id: true },
      }),
    ]);
    if (!item || !menu) return undefined;
    const rows = await db
      .delete(menuMemberships)
      .where(
        and(
          eq(menuMemberships.menuItemId, menuItemId),
          eq(menuMemberships.menuId, menuId),
        ),
      )
      .returning({ id: menuMemberships.id });
    return rows[0];
  },
};
