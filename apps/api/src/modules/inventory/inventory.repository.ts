/**
 * Inventory repository — data access only. No business rules (see
 * `inventory.service.ts` for low-stock event logic, the recipe-deduction
 * decision of which ingredients count, and menu-availability syncing).
 *
 * The one exception worth calling out: `applyStockChange` reads the
 * item's current stock and computes+persists the new balance inside a
 * single DB transaction, using the pure `resolveStockBalance` calculator
 * from `inventory-stock.ts`. That calculator has zero DB/business
 * dependencies of its own (same DB-free shape as `order-pricing.ts`), so
 * importing it here doesn't reintroduce business rules into the
 * repository — it keeps the read-compute-write atomic, exactly as the
 * pre-refactor code did (plain read-then-update in one transaction, no
 * `SELECT ... FOR UPDATE` then either — same level of concurrency safety
 * as before, not a new guarantee).
 */
import { eq, and, isNull, inArray } from "drizzle-orm";
import type { InventoryTransactionType, InventoryUnit } from "@pos/types";
import { db } from "../../db";
import {
  inventoryItems,
  inventoryTransactions,
  recipes,
  menuItems,
  orderInventoryDeductions,
  branches,
  orders,
} from "../../db/schema";
import { resolveStockBalance } from "./inventory-stock";

export type StockUpdateResult =
  | { status: "not_found" }
  | { status: "insufficient_stock" }
  | {
      status: "ok";
      item: typeof inventoryItems.$inferSelect;
      transaction: typeof inventoryTransactions.$inferSelect;
    };

export const inventoryRepository = {
  async findBranch(tenantId: string, branchId: string) {
    return db.query.branches.findFirst({
      where: and(
        eq(branches.id, branchId),
        eq(branches.tenantId, tenantId),
        eq(branches.isActive, true),
      ),
      columns: { id: true },
    });
  },
  async findMany(tenantId: string, branchId: string) {
    return db.query.inventoryItems.findMany({
      where: and(
        eq(inventoryItems.tenantId, tenantId),
        eq(inventoryItems.branchId, branchId),
        eq(inventoryItems.isActive, true),
        isNull(inventoryItems.deletedAt),
      ),
      orderBy: inventoryItems.name,
    });
  },

  // Aggregate view: every branch's stock, each item still tagged with its own
  // branch — deliberately not summed together, since "50 units at Branch A +
  // 30 at Branch B" isn't a meaningful single number for physical stock.
  async findAllBranches(tenantId: string) {
    return db.query.inventoryItems.findMany({
      where: and(
        eq(inventoryItems.tenantId, tenantId),
        eq(inventoryItems.isActive, true),
        isNull(inventoryItems.deletedAt),
      ),
      with: { branch: true },
      orderBy: inventoryItems.name,
    });
  },

  async findById(tenantId: string, id: string) {
    return db.query.inventoryItems.findFirst({
      where: and(
        eq(inventoryItems.id, id),
        eq(inventoryItems.tenantId, tenantId),
      ),
    });
  },

  async create(data: {
    tenantId: string;
    branchId: string;
    name: string;
    unit: InventoryUnit;
    currentStock: number;
    minimumStock: number;
    reorderPoint: number;
    costPerUnit: number;
  }) {
    const [item] = await db
      .insert(inventoryItems)
      .values({
        ...data,
        currentStock: data.currentStock.toFixed(3),
        minimumStock: data.minimumStock.toFixed(3),
        reorderPoint: data.reorderPoint.toFixed(3),
        costPerUnit: data.costPerUnit.toFixed(2),
      })
      .returning();
    return item!;
  },

  async applyStockChange(
    tenantId: string,
    itemId: string,
    quantity: number,
    transactionType: InventoryTransactionType,
    performedBy: string,
    notes?: string | undefined,
  ): Promise<StockUpdateResult> {
    return db.transaction(async (tx) => {
      const [item] = await tx
        .select()
        .from(inventoryItems)
        .where(
          and(
            eq(inventoryItems.id, itemId),
            eq(inventoryItems.tenantId, tenantId),
          ),
        );

      if (!item) return { status: "not_found" };

      const balanceBefore = parseFloat(item.currentStock);
      const resolution = resolveStockBalance(
        balanceBefore,
        quantity,
        transactionType,
      );
      if (!resolution.ok) return { status: "insufficient_stock" };

      const balanceAfter = resolution.balanceAfter;

      await tx
        .update(inventoryItems)
        .set({ currentStock: balanceAfter.toFixed(3), updatedAt: new Date() })
        .where(eq(inventoryItems.id, itemId));

      const [transaction] = await tx
        .insert(inventoryTransactions)
        .values({
          inventoryItemId: itemId,
          transactionType,
          quantity: quantity.toFixed(3),
          balanceBefore: balanceBefore.toFixed(3),
          balanceAfter: balanceAfter.toFixed(3),
          notes: notes ?? null,
          performedBy,
        })
        .returning();

      const [updated] = await tx
        .select()
        .from(inventoryItems)
        .where(eq(inventoryItems.id, itemId));

      return { status: "ok", item: updated!, transaction: transaction! };
    });
  },

  async findByIds(tenantId: string, ids: string[]) {
    if (!ids.length) return [];
    return db.query.inventoryItems.findMany({
      where: and(
        eq(inventoryItems.tenantId, tenantId),
        inArray(inventoryItems.id, ids),
      ),
    });
  },

  async findLowStock(tenantId: string, branchId: string) {
    const items = await db.query.inventoryItems.findMany({
      where: and(
        eq(inventoryItems.tenantId, tenantId),
        eq(inventoryItems.branchId, branchId),
        eq(inventoryItems.isActive, true),
      ),
    });
    return items.filter(
      (item) => parseFloat(item.currentStock) <= parseFloat(item.minimumStock),
    );
  },

  async findLowStockAllBranches(tenantId: string) {
    const items = await db.query.inventoryItems.findMany({
      where: and(
        eq(inventoryItems.tenantId, tenantId),
        eq(inventoryItems.isActive, true),
      ),
      with: { branch: true },
    });
    return items.filter(
      (item) => parseFloat(item.currentStock) <= parseFloat(item.minimumStock),
    );
  },

  // Raw audit trail of what a specific order deducted — used by the
  // order-detail "inventory impact" view.
  async findOrderDeductions(orderId: string) {
    return db.query.orderInventoryDeductions.findMany({
      where: eq(orderInventoryDeductions.orderId, orderId),
      with: {
        inventoryItem: true,
        menuItem: { columns: { id: true, name: true } },
      },
      orderBy: (t, { asc }) => [asc(t.deductedAt)],
    });
  },

  // Non-optional recipe lines for a set of menu items, joined with the
  // current inventory stock and whether the item even has recipe
  // deduction enabled. Shared by both `validateStock` (read-only check)
  // and `deductForOrderItems` (the same lines, actually applied) so the
  // "what counts as a required ingredient" query can't drift between the
  // two call sites.
  async findRequiredRecipeLines(menuItemIds: string[]) {
    if (!menuItemIds.length) return [];
    return db.query.recipes.findMany({
      where: and(
        inArray(recipes.menuItemId, menuItemIds),
        eq(recipes.isOptional, false),
      ),
      with: {
        inventoryItem: true,
        menuItem: { columns: { enableRecipeDeduction: true } },
      },
    });
  },

  // Applies a batch of already-resolved deduction lines inside one
  // transaction: floors each deduction at 0 (the order's already been
  // placed — this is bookkeeping, not a gate), logs an inventory
  // transaction row plus an order-inventory-deduction audit row per line.
  async deductRecipeLines(
    tenantId: string,
    branchId: string,
    orderId: string,
    lines: Array<{
      inventoryItemId: string;
      menuItemId: string;
      unit: InventoryUnit;
      neededQuantity: number;
    }>,
    performedBy: string | null,
  ): Promise<{
    deducted: number;
    touchedInventoryItemIds: string[];
    short: Array<{ inventoryItemId: string; name: string }>;
  }> {
    const short: Array<{ inventoryItemId: string; name: string }> = [];
    const touchedInventoryItemIds = new Set<string>();
    let deducted = 0;

    await db.transaction(async (tx) => {
      const [order] = await tx
        .select({ id: orders.id })
        .from(orders)
        .where(
          and(
            eq(orders.id, orderId),
            eq(orders.tenantId, tenantId),
            eq(orders.branchId, branchId),
          ),
        );
      if (!order) return;

      for (const line of lines) {
        const [invItem] = await tx
          .select()
          .from(inventoryItems)
          .where(
            and(
              eq(inventoryItems.id, line.inventoryItemId),
              eq(inventoryItems.tenantId, tenantId),
              eq(inventoryItems.branchId, branchId),
            ),
          );
        if (!invItem) continue;

        const balanceBefore = parseFloat(invItem.currentStock);
        const wasShort = line.neededQuantity > balanceBefore;
        const balanceAfter = Math.max(0, balanceBefore - line.neededQuantity);
        const actuallyDeducted = balanceBefore - balanceAfter;

        await tx
          .update(inventoryItems)
          .set({ currentStock: balanceAfter.toFixed(3), updatedAt: new Date() })
          .where(eq(inventoryItems.id, line.inventoryItemId));

        await tx.insert(inventoryTransactions).values({
          inventoryItemId: line.inventoryItemId,
          transactionType: "OUT",
          quantity: actuallyDeducted.toFixed(3),
          balanceBefore: balanceBefore.toFixed(3),
          balanceAfter: balanceAfter.toFixed(3),
          notes: `Auto-deducted for order ${orderId}`,
          performedBy,
        });

        await tx.insert(orderInventoryDeductions).values({
          orderId,
          menuItemId: line.menuItemId,
          inventoryItemId: line.inventoryItemId,
          quantityDeducted: actuallyDeducted.toFixed(3),
          unit: line.unit,
          wasShort,
        });

        deducted++;
        touchedInventoryItemIds.add(line.inventoryItemId);
        if (
          wasShort &&
          !short.some((s) => s.inventoryItemId === line.inventoryItemId)
        ) {
          short.push({
            inventoryItemId: line.inventoryItemId,
            name: invItem.name,
          });
        }
      }
    });

    return {
      deducted,
      touchedInventoryItemIds: Array.from(touchedInventoryItemIds),
      short,
    };
  },

  // Menu items whose recipe touches any of the given inventory items —
  // used to scope the post-deduction availability re-sync to just the
  // affected items rather than sweeping the whole branch.
  async findAffectedMenuItemIds(inventoryItemIds: string[], branchId: string) {
    if (!inventoryItemIds.length) return [];
    const rows = await db
      .selectDistinct({ id: recipes.menuItemId })
      .from(recipes)
      .innerJoin(menuItems, eq(menuItems.id, recipes.menuItemId))
      .where(
        and(
          inArray(recipes.inventoryItemId, inventoryItemIds),
          eq(menuItems.branchId, branchId),
        ),
      );
    return rows.map((r) => r.id);
  },

  async findMenuItemsForAvailability(
    tenantId: string,
    branchId: string,
    menuItemIds: string[],
  ) {
    if (!menuItemIds.length) return [];
    return db.query.menuItems.findMany({
      where: and(
        eq(menuItems.tenantId, tenantId),
        inArray(menuItems.id, menuItemIds),
        isNull(menuItems.deletedAt),
        eq(menuItems.branchId, branchId),
      ),
      columns: { id: true, status: true, enableRecipeDeduction: true },
    });
  },

  async findNonOptionalIngredients(
    tenantId: string,
    branchId: string,
    menuItemId: string,
  ) {
    return db
      .select({
        quantityRequired: recipes.quantityRequired,
        inventoryItem: inventoryItems,
      })
      .from(recipes)
      .innerJoin(inventoryItems, eq(inventoryItems.id, recipes.inventoryItemId))
      .where(
        and(
          eq(recipes.menuItemId, menuItemId),
          eq(recipes.isOptional, false),
          eq(inventoryItems.tenantId, tenantId),
          eq(inventoryItems.branchId, branchId),
        ),
      );
  },

  async setMenuItemAvailabilityStatus(
    menuItemId: string,
    status: "ACTIVE" | "OUT_OF_STOCK",
    availabilityReason: string | null,
  ) {
    await db
      .update(menuItems)
      .set({
        status,
        availabilityReason,
        statusChangedAt: new Date(),
        isAvailable: status === "ACTIVE",
        updatedAt: new Date(),
      })
      .where(eq(menuItems.id, menuItemId));
  },
};
