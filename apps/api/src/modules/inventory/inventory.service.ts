/**
 * Inventory service — business rules that used to live inline in the
 * controller/repository: low-stock event publishing, deciding which
 * recipe lines actually count (non-optional + `enableRecipeDeduction`),
 * and re-deriving menu-item ACTIVE/OUT_OF_STOCK status after a stock
 * change. Data access lives in `inventory.repository.ts`.
 */
import type { AuthContext } from "../../core/auth";
import { inventoryRepository } from "./inventory.repository";
import {
  requireInventoryPermission,
  requireInventoryTransactionPermission,
  resolveInventoryBranch,
  assertInventoryResourceBranch,
} from "./inventory-authorization";
import { ForbiddenError } from "../../core/errors";
import { inventoryItemNotFound, insufficientStock } from "./inventory.errors";
import { eventBus } from "../../lib/event-bus";
import type { InventoryTransactionType, InventoryUnit } from "@pos/types";

export interface CreateInventoryItemInput {
  name: string;
  unit: InventoryUnit;
  currentStock: number;
  minimumStock: number;
  reorderPoint: number;
  costPerUnit: number;
  branchId?: string | undefined;
}

export interface UpdateStockInput {
  quantity: number;
  transactionType: InventoryTransactionType;
  notes?: string | undefined;
}

export const inventoryService = {
  // Branch-locked staff see only their own branch; OWNER/MANAGER can pass
  // `null` (resolved from "all branches") to see everything, tagged by branch.
  async list(auth: AuthContext) {
    requireInventoryPermission(auth, "inventory:read");
    if (auth.tenantWide && !auth.branchId)
      return inventoryRepository.findAllBranches(auth.tenantId);
    const branchId = resolveInventoryBranch(auth);
    return inventoryRepository.findMany(auth.tenantId, branchId);
  },

  async create(auth: AuthContext, input: CreateInventoryItemInput) {
    requireInventoryPermission(auth, "inventory:create");
    const branchId = resolveInventoryBranch(auth, input.branchId);

    const branch = await inventoryRepository.findBranch(
      auth.tenantId,
      branchId,
    );
    if (!branch) throw new ForbiddenError("Branch access denied");

    const item = await inventoryRepository.create({
      tenantId: auth.tenantId,
      branchId,
      name: input.name,
      unit: input.unit,
      currentStock: input.currentStock,
      minimumStock: input.minimumStock,
      reorderPoint: input.reorderPoint,
      costPerUnit: input.costPerUnit,
    });

    if (parseFloat(item.currentStock) <= parseFloat(item.minimumStock)) {
      await eventBus.publish(
        { type: "inventory.low_stock", payload: item as any },
        auth.tenantId,
        branchId,
      );
    }

    return item;
  },

  // The item already belongs to a specific branch — derive it from there
  // rather than requiring the request context to supply one, so stock can
  // be adjusted directly from the "All Branches" view too.
  async updateStock(
    auth: AuthContext,
    itemId: string,
    input: UpdateStockInput,
  ) {
    requireInventoryPermission(auth, "inventory:update");
    requireInventoryTransactionPermission(auth, input.transactionType);
    const existing = await inventoryRepository.findById(auth.tenantId, itemId);
    if (!existing) throw inventoryItemNotFound(itemId);
    assertInventoryResourceBranch(auth, existing.branchId);

    const result = await inventoryRepository.applyStockChange(
      auth.tenantId,
      itemId,
      input.quantity,
      input.transactionType,
      auth.userId,
      input.notes,
    );

    if (result.status === "not_found") throw inventoryItemNotFound(itemId);
    if (result.status === "insufficient_stock") throw insufficientStock();

    const branchId = existing.branchId;
    const currentStock = parseFloat(result.item.currentStock);
    const minimumStock = parseFloat(result.item.minimumStock);
    if (currentStock <= minimumStock) {
      await eventBus.publish(
        { type: "inventory.low_stock", payload: result.item as any },
        auth.tenantId,
        branchId,
      );
    }

    // Manual adjustments (restock, waste, correction) can push an item's
    // recipe-derived availability either way — keep menu status in sync
    // here too, not just after order-driven deductions.
    await inventoryService.syncMenuItemAvailability(auth.tenantId, branchId, [
      itemId,
    ]);

    return { item: result.item, transaction: result.transaction };
  },

  async lowStockAlerts(auth: AuthContext) {
    requireInventoryPermission(auth, "inventory:read");
    if (auth.tenantWide && !auth.branchId)
      return inventoryRepository.findLowStockAllBranches(auth.tenantId);
    const branchId = resolveInventoryBranch(auth);
    return inventoryRepository.findLowStock(auth.tenantId, branchId);
  },

  async getOrderDeductions(orderId: string) {
    return inventoryRepository.findOrderDeductions(orderId);
  },

  // Checks whether ONE unit of each requested item can currently be made,
  // given its recipe and current stock — used at order-creation time as a
  // last-second guard in addition to the item's ACTIVE/OUT_OF_STOCK status
  // (status can lag a few seconds behind concurrent orders racing for the
  // same stock; this catches that window).
  async validateStock(
    _tenantId: string,
    items: Array<{ menuItemId: string; quantity: number }>,
  ): Promise<{
    valid: boolean;
    insufficient: Array<{
      menuItemId: string;
      inventoryItemId: string;
      name: string;
    }>;
  }> {
    const menuItemIds = items.map((i) => i.menuItemId);
    if (!menuItemIds.length) return { valid: true, insufficient: [] };

    const recipeLines =
      await inventoryRepository.findRequiredRecipeLines(menuItemIds);

    const requiredByInventoryItem = new Map<string, number>();
    for (const item of items) {
      for (const r of recipeLines) {
        if (
          r.menuItemId !== item.menuItemId ||
          !r.menuItem.enableRecipeDeduction
        )
          continue;
        const need = parseFloat(r.quantityRequired) * item.quantity;
        requiredByInventoryItem.set(
          r.inventoryItemId,
          (requiredByInventoryItem.get(r.inventoryItemId) ?? 0) + need,
        );
      }
    }

    const insufficient: Array<{
      menuItemId: string;
      inventoryItemId: string;
      name: string;
    }> = [];
    const stockCache = new Map<string, number>();
    for (const r of recipeLines) {
      if (!requiredByInventoryItem.has(r.inventoryItemId)) continue;
      const available =
        stockCache.get(r.inventoryItemId) ??
        parseFloat(r.inventoryItem.currentStock);
      stockCache.set(r.inventoryItemId, available);
      const totalNeeded = requiredByInventoryItem.get(r.inventoryItemId)!;
      if (
        totalNeeded > available &&
        !insufficient.some((x) => x.inventoryItemId === r.inventoryItemId)
      ) {
        insufficient.push({
          menuItemId: r.menuItemId,
          inventoryItemId: r.inventoryItemId,
          name: r.inventoryItem.name,
        });
      }
    }

    return { valid: insufficient.length === 0, insufficient };
  },

  // Called once a round is actually fired to the kitchen (new order, or a
  // new ticket on an existing tab). Deducts every non-optional ingredient
  // for every item in the round, floors at 0 rather than throwing on a
  // shortfall (the order's already been placed — this is bookkeeping, not
  // a gate), and logs each deduction against the order for the
  // inventory-impact view. Returns which ingredients came up short so the
  // caller can surface a warning if it wants to.
  async deductForOrderItems(
    tenantId: string,
    branchId: string,
    orderId: string,
    items: Array<{ menuItemId: string; quantity: number }>,
    performedBy: string,
  ): Promise<{
    deducted: number;
    short: Array<{ inventoryItemId: string; name: string }>;
  }> {
    const menuItemIds = items.map((i) => i.menuItemId);
    if (!menuItemIds.length) return { deducted: 0, short: [] };

    const recipeLines =
      await inventoryRepository.findRequiredRecipeLines(menuItemIds);
    if (!recipeLines.length) return { deducted: 0, short: [] };

    const lines: Array<{
      inventoryItemId: string;
      menuItemId: string;
      unit: InventoryUnit;
      neededQuantity: number;
    }> = [];
    for (const item of items) {
      const itemRecipes = recipeLines.filter(
        (r) =>
          r.menuItemId === item.menuItemId && r.menuItem.enableRecipeDeduction,
      );
      for (const r of itemRecipes) {
        lines.push({
          inventoryItemId: r.inventoryItemId,
          menuItemId: item.menuItemId,
          unit: r.unit,
          neededQuantity: parseFloat(r.quantityRequired) * item.quantity,
        });
      }
    }
    if (!lines.length) return { deducted: 0, short: [] };

    const { deducted, touchedInventoryItemIds, short } =
      await inventoryRepository.deductRecipeLines(
        tenantId,
        branchId,
        orderId,
        lines,
        performedBy,
      );

    if (touchedInventoryItemIds.length) {
      await inventoryService.syncMenuItemAvailability(
        tenantId,
        branchId,
        touchedInventoryItemIds,
      );
      const touchedItems = await inventoryRepository.findByIds(
        tenantId,
        touchedInventoryItemIds,
      );
      for (const item of touchedItems) {
        if (parseFloat(item.currentStock) <= parseFloat(item.minimumStock)) {
          await eventBus.publish(
            { type: "inventory.low_stock", payload: item as any },
            tenantId,
            branchId,
          );
        }
      }
    }

    return { deducted, short };
  },

  // After inventory moves (via order deduction or a manual stock update),
  // re-derive ACTIVE/OUT_OF_STOCK for every menu item whose recipe touches
  // one of the given inventory items — scoped to just the affected
  // ingredients rather than sweeping the whole branch on every order.
  async syncMenuItemAvailability(
    tenantId: string,
    branchId: string,
    inventoryItemIds: string[],
  ) {
    if (!inventoryItemIds.length) return;

    const affectedItemIds = await inventoryRepository.findAffectedMenuItemIds(
      inventoryItemIds,
      branchId,
    );
    if (!affectedItemIds.length) return;

    const items = await inventoryRepository.findMenuItemsForAvailability(
      tenantId,
      branchId,
      affectedItemIds,
    );

    for (const item of items) {
      if (!item.enableRecipeDeduction) continue;
      // Only auto-manage ACTIVE <-> OUT_OF_STOCK — never override HIDDEN,
      // SEASONAL, or DISCONTINUED, which are deliberate manual states.
      if (item.status !== "ACTIVE" && item.status !== "OUT_OF_STOCK") continue;

      const ingredients = await inventoryRepository.findNonOptionalIngredients(
        tenantId,
        branchId,
        item.id,
      );
      const canOrder = ingredients.every(
        (ing) =>
          parseFloat(ing.inventoryItem.currentStock) >=
          parseFloat(ing.quantityRequired),
      );

      if (!canOrder && item.status === "ACTIVE") {
        await inventoryRepository.setMenuItemAvailabilityStatus(
          item.id,
          "OUT_OF_STOCK",
          "Insufficient inventory",
        );
      } else if (canOrder && item.status === "OUT_OF_STOCK") {
        await inventoryRepository.setMenuItemAvailabilityStatus(
          item.id,
          "ACTIVE",
          null,
        );
      }
    }
  },
};
