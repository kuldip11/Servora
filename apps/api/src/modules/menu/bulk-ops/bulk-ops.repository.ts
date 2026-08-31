/** Persistence operations for menu bulk workflows. */
import { eq, and, inArray, isNull } from "drizzle-orm";
import { db } from "../../../db";
import type { MenuItemStatus } from "@pos/types";
import {
  menuItems,
  menuItemModifierGroups,
  menuItemTags,
  orders,
  orderItems,
} from "../../../db/schema";

export type BulkMode = "add" | "remove" | "replace";
export type PriceMode = "set" | "increase" | "decrease";

export const bulkOpsRepository = {
  async findItemScopes(tenantId: string, itemIds: string[]) {
    if (!itemIds.length) return [];
    return db.query.menuItems.findMany({
      where: and(
        eq(menuItems.tenantId, tenantId),
        inArray(menuItems.id, itemIds),
        isNull(menuItems.deletedAt),
      ),
      columns: { id: true, branchId: true },
    });
  },
  async updateItemsStatus(
    tenantId: string,
    itemIds: string[],
    status: MenuItemStatus,
    reason?: string,
  ): Promise<{ updated: number }> {
    if (!itemIds.length) return { updated: 0 };
    const rows = await db
      .update(menuItems)
      .set({
        status,
        availabilityReason: reason ?? null,
        statusChangedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(menuItems.tenantId, tenantId),
          inArray(menuItems.id, itemIds),
          isNull(menuItems.deletedAt),
        ),
      )
      .returning({ id: menuItems.id });
    return { updated: rows.length };
  },

  async updateItemsCategory(
    tenantId: string,
    itemIds: string[],
    categoryId: string,
  ): Promise<{ updated: number }> {
    if (!itemIds.length) return { updated: 0 };
    const rows = await db
      .update(menuItems)
      .set({ categoryId, updatedAt: new Date() })
      .where(
        and(
          eq(menuItems.tenantId, tenantId),
          inArray(menuItems.id, itemIds),
          isNull(menuItems.deletedAt),
        ),
      )
      .returning({ id: menuItems.id });
    return { updated: rows.length };
  },

  async bulkSetItemTags(
    tenantId: string,
    itemIds: string[],
    tagIds: string[],
    mode: BulkMode,
  ): Promise<{ updated: number }> {
    if (!itemIds.length) return { updated: 0 };
    // Scope itemIds to this tenant first so a stray id from another tenant
    // can't be used to tamper with unrelated link rows.
    const owned = await db.query.menuItems.findMany({
      where: and(
        eq(menuItems.tenantId, tenantId),
        inArray(menuItems.id, itemIds),
      ),
      columns: { id: true },
    });
    const ownedIds = owned.map((i) => i.id);
    if (!ownedIds.length) return { updated: 0 };

    if (mode === "replace") {
      await db
        .delete(menuItemTags)
        .where(inArray(menuItemTags.menuItemId, ownedIds));
      if (tagIds.length) {
        await db
          .insert(menuItemTags)
          .values(
            ownedIds.flatMap((menuItemId) =>
              tagIds.map((tagId) => ({ menuItemId, tagId })),
            ),
          );
      }
    } else if (mode === "add") {
      if (tagIds.length) {
        await db
          .insert(menuItemTags)
          .values(
            ownedIds.flatMap((menuItemId) =>
              tagIds.map((tagId) => ({ menuItemId, tagId })),
            ),
          )
          .onConflictDoNothing();
      }
    } else {
      // remove
      await db
        .delete(menuItemTags)
        .where(
          and(
            inArray(menuItemTags.menuItemId, ownedIds),
            inArray(menuItemTags.tagId, tagIds),
          ),
        );
    }
    return { updated: ownedIds.length };
  },

  async bulkSetItemModifierGroups(
    tenantId: string,
    itemIds: string[],
    modifierGroupIds: string[],
    mode: BulkMode,
  ): Promise<{ updated: number }> {
    if (!itemIds.length) return { updated: 0 };
    const owned = await db.query.menuItems.findMany({
      where: and(
        eq(menuItems.tenantId, tenantId),
        inArray(menuItems.id, itemIds),
      ),
      columns: { id: true },
    });
    const ownedIds = owned.map((i) => i.id);
    if (!ownedIds.length) return { updated: 0 };

    if (mode === "replace") {
      await db
        .delete(menuItemModifierGroups)
        .where(inArray(menuItemModifierGroups.menuItemId, ownedIds));
      if (modifierGroupIds.length) {
        await db.insert(menuItemModifierGroups).values(
          ownedIds.flatMap((menuItemId) =>
            modifierGroupIds.map((modifierGroupId, i) => ({
              menuItemId,
              modifierGroupId,
              sortOrder: i,
            })),
          ),
        );
      }
    } else if (mode === "add") {
      if (modifierGroupIds.length) {
        await db
          .insert(menuItemModifierGroups)
          .values(
            ownedIds.flatMap((menuItemId) =>
              modifierGroupIds.map((modifierGroupId, i) => ({
                menuItemId,
                modifierGroupId,
                sortOrder: i,
              })),
            ),
          )
          .onConflictDoNothing();
      }
    } else {
      await db
        .delete(menuItemModifierGroups)
        .where(
          and(
            inArray(menuItemModifierGroups.menuItemId, ownedIds),
            inArray(menuItemModifierGroups.modifierGroupId, modifierGroupIds),
          ),
        );
    }
    return { updated: ownedIds.length };
  },

  async bulkUpdatePrice(
    tenantId: string,
    itemIds: string[],
    priceChange: number,
    mode: PriceMode,
  ): Promise<{
    updated: number;
    changes: Array<{ itemId: string; oldPrice: number; newPrice: number }>;
  }> {
    if (!itemIds.length) return { updated: 0, changes: [] };
    const items = await db.query.menuItems.findMany({
      where: and(
        eq(menuItems.tenantId, tenantId),
        inArray(menuItems.id, itemIds),
        isNull(menuItems.deletedAt),
      ),
      columns: { id: true, basePrice: true },
    });

    const changes: Array<{
      itemId: string;
      oldPrice: number;
      newPrice: number;
    }> = [];
    for (const item of items) {
      const oldPrice = parseFloat(item.basePrice);
      let newPrice: number;
      if (mode === "set") newPrice = priceChange;
      else if (mode === "increase")
        newPrice = oldPrice * (1 + priceChange / 100);
      else newPrice = oldPrice * (1 - priceChange / 100);
      newPrice = Math.max(0, Math.round(newPrice * 100) / 100);

      await db
        .update(menuItems)
        .set({ basePrice: String(newPrice), updatedAt: new Date() })
        .where(eq(menuItems.id, item.id));

      changes.push({ itemId: item.id, oldPrice, newPrice });
    }
    return { updated: changes.length, changes };
  },

  async bulkDeleteItems(
    tenantId: string,
    itemIds: string[],
  ): Promise<{ deleted: number; protected: number }> {
    if (!itemIds.length) return { deleted: 0, protected: 0 };
    // "Protected" = items that are line items on any order that isn't
    // finished (OPEN / BILL_REQUESTED) — soft-deleting those would corrupt
    // an in-progress bill's history. Everything else (already CLOSED/PAID
    // orders, or no orders at all) is safe to soft-delete.
    const protectedRows = await db
      .selectDistinct({ id: orderItems.menuItemId })
      .from(orderItems)
      .innerJoin(orders, eq(orders.id, orderItems.orderId))
      .where(
        and(
          inArray(orderItems.menuItemId, itemIds),
          inArray(orders.status, ["OPEN", "BILL_REQUESTED"]),
        ),
      );
    const protectedIds = new Set(protectedRows.map((r) => r.id));
    const deletableIds = itemIds.filter((id) => !protectedIds.has(id));

    if (!deletableIds.length)
      return { deleted: 0, protected: protectedIds.size };

    const rows = await db
      .update(menuItems)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(menuItems.tenantId, tenantId),
          inArray(menuItems.id, deletableIds),
          isNull(menuItems.deletedAt),
        ),
      )
      .returning({ id: menuItems.id });

    return { deleted: rows.length, protected: protectedIds.size };
  },
};
