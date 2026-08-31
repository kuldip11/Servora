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
import { ForbiddenError, ValidationError, NotFoundError } from "../../core/errors";
import { inventoryItemNotFound, insufficientStock } from "./inventory.errors";
import { eventBus } from "../../lib/event-bus";
import type { InventoryItem, InventoryTransactionType, InventoryUnit } from "@pos/types";
import { areInventoryUnitsCompatible, convertInventoryQuantity } from "./inventory-units";
import { availabilityService } from "../menu/availability/availability.service";

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
  wasteReasonId?: string | undefined;
}

export interface RecipeNeedItemInput {
  menuItemId: string;
  variantId?: string | null | undefined;
  quantity: number;
  weightQuantity?: number | string | null | undefined;
  weightUnit?: "G" | "KG" | "LB" | "OZ" | null | undefined;
  selectedOptions?: Array<{ optionId: string; quantity?: number | undefined }> | undefined;
}

/**
 * Persisted deduction input. Unlike read-only recipe calculations, a real
 * deduction must always be attributable to one exact order item so E5 void
 * reversal can restore every consumed source exactly once.
 */
export interface InventoryOrderItemInput extends RecipeNeedItemInput {
  orderItemId: string;
}

/** G3: recipe definitions for weight-priced items are normalized per kilogram. */
export function weightRecipeScale(
  weightQuantity?: number | string | null,
  weightUnit?: "G" | "KG" | "LB" | "OZ" | null,
): number {
  if (weightQuantity == null || weightUnit == null) return 1;
  const quantity = Number(weightQuantity);
  if (!Number.isFinite(quantity) || quantity <= 0) return 1;
  switch (weightUnit) {
    case "G": return quantity / 1000;
    case "KG": return quantity;
    case "LB": return quantity * 0.45359237;
    case "OZ": return quantity * 0.028349523125;
  }
}

type RequiredRecipeRow = Awaited<ReturnType<typeof inventoryRepository.findRequiredRecipeLines>>[number];

type ResolvedRawNeed = {
  inventoryItemId: string;
  name: string;
  currentStock: number;
  unit: InventoryUnit;
  neededQuantity: number;
  costPerUnit: number;
};

function yieldFactor(value: string | null | undefined): number {
  if (value == null) return 1;
  const percent = Number(value);
  return Number.isFinite(percent) && percent > 0 ? percent / 100 : 1;
}

function recipeSourceKey(row: RequiredRecipeRow): string {
  return row.inventoryItemId ? `inventory:${row.inventoryItemId}` : `sub:${row.subRecipeId}`;
}

function applicableRecipeRows(
  rows: RequiredRecipeRow[],
  item: RecipeNeedItemInput,
  requireRecipeDeductionEnabled = true,
) {
  const itemRows = rows.filter(
    (row) =>
      row.menuItemId === item.menuItemId &&
      (!requireRecipeDeductionEnabled || row.menuItem.enableRecipeDeduction),
  );
  const base = itemRows.filter((row) => !row.variantId && !row.modifierOptionId);
  const variantRows = item.variantId
    ? itemRows.filter((row) => row.variantId === item.variantId)
    : [];
  const overridden = new Set(variantRows.map(recipeSourceKey));
  const selected: Array<{ row: RequiredRecipeRow; multiplier: number }> = [
    ...base.filter((row) => !overridden.has(recipeSourceKey(row))).map((row) => ({ row, multiplier: 1 })),
    ...variantRows.map((row) => ({ row, multiplier: 1 })),
  ];

  const optionQuantities = new Map<string, number>();
  for (const option of item.selectedOptions ?? []) {
    optionQuantities.set(option.optionId, (optionQuantities.get(option.optionId) ?? 0) + (option.quantity ?? 1));
  }
  for (const row of itemRows) {
    if (!row.modifierOptionId) continue;
    const multiplier = optionQuantities.get(row.modifierOptionId) ?? 0;
    if (multiplier > 0) selected.push({ row, multiplier });
  }
  return selected;
}

function convertRecipeQuantity(
  quantity: number,
  from: InventoryUnit,
  to: InventoryUnit,
  label: string,
): number {
  if (!areInventoryUnitsCompatible(from, to)) {
    throw new ValidationError(`${label} uses incompatible units (${from} → ${to})`);
  }
  return convertInventoryQuantity(quantity, from, to);
}

async function resolveSubRecipeNeed(
  tenantId: string,
  branchId: string,
  subRecipeId: string,
  preparedQuantityNeeded: number,
  preparedUnit: InventoryUnit,
  depth = 1,
  path = new Set<string>(),
): Promise<ResolvedRawNeed[]> {
  if (depth > 3) throw new ValidationError("Sub-recipe depth exceeds supported maximum");
  if (path.has(subRecipeId)) throw new ValidationError("Circular sub-recipe reference detected");
  const subRecipe = await inventoryRepository.findSubRecipeWithIngredients(tenantId, subRecipeId);
  if (!subRecipe) throw new ValidationError("Sub-recipe could not be resolved");
  if (subRecipe.branchId !== branchId) {
    throw new ValidationError(`Sub-recipe ${subRecipe.name ?? subRecipeId} is not compatible with the active branch`);
  }
  const nextPath = new Set(path);
  nextPath.add(subRecipeId);
  const yieldQuantity = Math.max(Number(subRecipe.yieldQuantity), 0.000001);
  const normalizedPreparedQuantity = convertRecipeQuantity(
    preparedQuantityNeeded,
    preparedUnit,
    subRecipe.yieldUnit,
    `Sub-recipe ${subRecipe.name ?? subRecipeId}`,
  );
  const scale = normalizedPreparedQuantity / yieldQuantity / yieldFactor(subRecipe.yieldPercent);
  const needs: ResolvedRawNeed[] = [];
  for (const ingredient of subRecipe.ingredients) {
    const quantity = Number(ingredient.quantityRequired) * scale;
    if (ingredient.inventoryItemId && ingredient.inventoryItem) {
      if (ingredient.inventoryItem.tenantId !== tenantId) {
        throw new ValidationError(`Sub-recipe ${subRecipe.name ?? subRecipeId} references inventory outside this tenant`);
      }
      if (ingredient.inventoryItem.branchId !== branchId) {
        throw new ValidationError(
          `Sub-recipe ${subRecipe.name ?? subRecipeId} is not compatible with the active branch`,
        );
      }
      const neededQuantity = convertRecipeQuantity(
        quantity,
        ingredient.unit,
        ingredient.inventoryItem.unit,
        `Ingredient ${ingredient.inventoryItem.name}`,
      );
      needs.push({
        inventoryItemId: ingredient.inventoryItemId,
        name: ingredient.inventoryItem.name,
        currentStock: Number(ingredient.inventoryItem.currentStock),
        unit: ingredient.inventoryItem.unit,
        neededQuantity,
        costPerUnit: Number(ingredient.inventoryItem.costPerUnit),
      });
    } else if (ingredient.ingredientSubRecipeId) {
      needs.push(...await resolveSubRecipeNeed(
        tenantId,
        branchId,
        ingredient.ingredientSubRecipeId,
        quantity,
        ingredient.unit,
        depth + 1,
        nextPath,
      ));
    }
  }
  return needs;
}

async function resolveOrderItemRecipeNeeds(
  tenantId: string,
  branchId: string,
  rows: RequiredRecipeRow[],
  item: RecipeNeedItemInput,
  requireRecipeDeductionEnabled = true,
): Promise<ResolvedRawNeed[]> {
  const needs: ResolvedRawNeed[] = [];
  for (const { row, multiplier } of applicableRecipeRows(
    rows,
    item,
    requireRecipeDeductionEnabled,
  )) {
    const quantity = Number(row.quantityRequired) * item.quantity * multiplier * weightRecipeScale(item.weightQuantity, item.weightUnit) / yieldFactor(row.yieldPercent);
    if (row.inventoryItemId && row.inventoryItem) {
      if (row.inventoryItem.branchId !== branchId) {
        throw new ValidationError(`Recipe ingredient ${row.inventoryItem.name} is not compatible with the active branch`);
      }
      const neededQuantity = convertRecipeQuantity(
        quantity,
        row.unit,
        row.inventoryItem.unit,
        `Recipe ingredient ${row.inventoryItem.name}`,
      );
      needs.push({
        inventoryItemId: row.inventoryItemId,
        name: row.inventoryItem.name,
        currentStock: Number(row.inventoryItem.currentStock),
        unit: row.inventoryItem.unit,
        neededQuantity,
        costPerUnit: Number(row.inventoryItem.costPerUnit),
      });
    } else if (row.subRecipeId) {
      needs.push(...await resolveSubRecipeNeed(tenantId, branchId, row.subRecipeId, quantity, row.unit));
    }
  }
  return needs;
}

function aggregateRawNeeds(needs: ResolvedRawNeed[]) {
  const aggregated = new Map<string, ResolvedRawNeed>();
  for (const need of needs) {
    const existing = aggregated.get(need.inventoryItemId);
    if (existing) existing.neededQuantity += need.neededQuantity;
    else aggregated.set(need.inventoryItemId, { ...need });
  }
  return Array.from(aggregated.values());
}

function canSatisfyNeeds(needs: ResolvedRawNeed[]) {
  return aggregateRawNeeds(needs).every((need) => need.currentStock >= need.neededQuantity);
}

function toRealtimeInventoryItem(item: {
  id: string;
  tenantId: string;
  branchId: string;
  name: string;
  unit: InventoryUnit;
  currentStock: string;
  minimumStock: string;
  reorderPoint: string;
  costPerUnit: string;
  isActive: boolean;
}): InventoryItem {
  return {
    id: item.id,
    tenantId: item.tenantId,
    branchId: item.branchId,
    name: item.name,
    unit: item.unit,
    currentStock: Number(item.currentStock),
    minimumStock: Number(item.minimumStock),
    reorderPoint: Number(item.reorderPoint),
    costPerUnit: Number(item.costPerUnit),
    isActive: item.isActive,
  };
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
        { type: "inventory.low_stock", payload: toRealtimeInventoryItem(item) },
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

    let wasteReasonId: string | null = null;
    if (input.transactionType === "WASTE") {
      if (!(input.quantity > 0)) {
        throw new ValidationError("Waste quantity must be greater than zero");
      }
      if (!input.wasteReasonId) throw new ValidationError("A waste reason is required");
      const reason = await inventoryRepository.findWasteReason(auth.tenantId, input.wasteReasonId);
      if (!reason || !reason.isActive) throw new ValidationError("Waste reason is invalid or inactive");
      wasteReasonId = reason.id;
    } else if (input.wasteReasonId) {
      throw new ValidationError("wasteReasonId is only valid for WASTE transactions");
    }

    const result = await inventoryRepository.applyStockChange(
      auth.tenantId,
      itemId,
      input.quantity,
      input.transactionType,
      auth.userId,
      input.notes,
      wasteReasonId,
    );

    if (result.status === "not_found") throw inventoryItemNotFound(itemId);
    if (result.status === "insufficient_stock") throw insufficientStock();

    const branchId = existing.branchId;
    const currentStock = parseFloat(result.item.currentStock);
    const minimumStock = parseFloat(result.item.minimumStock);
    if (currentStock <= minimumStock) {
      await eventBus.publish(
        { type: "inventory.low_stock", payload: toRealtimeInventoryItem(result.item) },
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

  async recentTransactions(auth: AuthContext, limit = 25) {
    requireInventoryPermission(auth, "inventory:read");
    const branchId =
      auth.tenantWide && !auth.branchId ? null : resolveInventoryBranch(auth);
    return inventoryRepository.findRecentTransactions(
      auth.tenantId,
      branchId,
      limit,
    );
  },

  async listWasteReasons(auth: AuthContext, includeInactive = false) {
    requireInventoryPermission(auth, "inventory:read");
    return inventoryRepository.listWasteReasons(auth.tenantId, includeInactive);
  },

  async createWasteReason(auth: AuthContext, label: string) {
    requireInventoryPermission(auth, "inventory:update");
    const normalized = label.trim();
    if (!normalized) throw new ValidationError("Waste reason label is required");
    return inventoryRepository.createWasteReason(auth.tenantId, normalized);
  },

  async updateWasteReason(
    auth: AuthContext,
    id: string,
    input: { label?: string | undefined; isActive?: boolean | undefined },
  ) {
    requireInventoryPermission(auth, "inventory:update");
    const existing = await inventoryRepository.findWasteReason(auth.tenantId, id);
    if (!existing) throw new NotFoundError("Waste reason");
    const row = await inventoryRepository.updateWasteReason(auth.tenantId, id, {
      ...(input.label !== undefined ? { label: input.label.trim() } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    });
    if (!row) throw new NotFoundError("Waste reason");
    return row;
  },

  async logWaste(
    auth: AuthContext,
    itemId: string,
    input: { quantity: number; wasteReasonId: string; notes?: string | undefined },
  ) {
    if (!(input.quantity > 0)) throw new ValidationError("Waste quantity must be greater than zero");
    return inventoryService.updateStock(auth, itemId, {
      quantity: input.quantity,
      transactionType: "WASTE",
      wasteReasonId: input.wasteReasonId,
      ...(input.notes ? { notes: input.notes } : {}),
    });
  },

  async getOrderDeductions(orderId: string) {
    return inventoryRepository.findOrderDeductions(orderId);
  },

  async getRecipeImpact(auth: AuthContext, inventoryItemId: string) {
    requireInventoryPermission(auth, "inventory:read");
    const inventoryItem = await inventoryRepository.findById(auth.tenantId, inventoryItemId);
    if (!inventoryItem) throw inventoryItemNotFound(inventoryItemId);
    assertInventoryResourceBranch(auth, inventoryItem.branchId);
    const branchId = inventoryItem.branchId;

    const menuItemIds = await inventoryRepository.findAllRecipeMenuItemIds(auth.tenantId, branchId);
    if (!menuItemIds.length) {
      return { inventoryItemId, inventoryItemName: inventoryItem.name, impacts: [] };
    }

    const [recipeRows, menuItems, variants, options] = await Promise.all([
      inventoryRepository.findRequiredRecipeLines(auth.tenantId, branchId, menuItemIds),
      inventoryRepository.findMenuItemsForAvailability(auth.tenantId, branchId, menuItemIds),
      inventoryRepository.findScopedRecipeVariants(auth.tenantId, branchId),
      inventoryRepository.findScopedRecipeModifierOptions(auth.tenantId, branchId),
    ]);

    const impacts: Array<{
      kind: "ITEM" | "VARIANT" | "MODIFIER_OPTION";
      menuItemId: string;
      menuItemName: string;
      entityId: string;
      entityName: string;
      computedAvailable: boolean;
    }> = [];

    for (const item of menuItems) {
      if (!item.enableRecipeDeduction) continue;
      const baseRows = recipeRows.filter((row) =>
        row.menuItemId === item.id && !row.variantId && !row.modifierOptionId,
      );
      const needs = await resolveOrderItemRecipeNeeds(auth.tenantId, branchId, baseRows, {
        menuItemId: item.id,
        quantity: 1,
      });
      if (needs.some((need) => need.inventoryItemId === inventoryItemId)) {
        impacts.push({
          kind: "ITEM",
          menuItemId: item.id,
          menuItemName: item.name,
          entityId: item.id,
          entityName: item.name,
          computedAvailable: canSatisfyNeeds(needs),
        });
      }
    }

    for (const variant of variants) {
      const scopedRows = recipeRows.filter((row) => row.variantId === variant.id);
      const needs = await resolveOrderItemRecipeNeeds(auth.tenantId, branchId, scopedRows, {
        menuItemId: variant.menuItemId,
        variantId: variant.id,
        quantity: 1,
      });
      if (needs.some((need) => need.inventoryItemId === inventoryItemId)) {
        impacts.push({
          kind: "VARIANT",
          menuItemId: variant.menuItemId,
          menuItemName: variant.menuItemName,
          entityId: variant.id,
          entityName: variant.name,
          computedAvailable: canSatisfyNeeds(needs),
        });
      }
    }

    for (const option of options) {
      const scopedRows = recipeRows.filter((row) => row.modifierOptionId === option.id);
      const needs = await resolveOrderItemRecipeNeeds(auth.tenantId, branchId, scopedRows, {
        menuItemId: option.menuItemId,
        quantity: 1,
        selectedOptions: [{ optionId: option.id, quantity: 1 }],
      });
      if (needs.some((need) => need.inventoryItemId === inventoryItemId)) {
        impacts.push({
          kind: "MODIFIER_OPTION",
          menuItemId: option.menuItemId,
          menuItemName: option.menuItemName,
          entityId: option.id,
          entityName: option.name,
          computedAvailable: canSatisfyNeeds(needs),
        });
      }
    }

    return { inventoryItemId, inventoryItemName: inventoryItem.name, impacts };
  },

  // Checks whether ONE unit of each requested item can currently be made,
  // given its recipe and current stock — used at order-creation time as a
  // last-second guard in addition to the item's ACTIVE/OUT_OF_STOCK status
  // (status can lag a few seconds behind concurrent orders racing for the
  // same stock; this catches that window).
  async validateStock(
    tenantId: string,
    branchId: string,
    items: RecipeNeedItemInput[],
  ): Promise<{
    valid: boolean;
    insufficient: Array<{ menuItemId: string; inventoryItemId: string; name: string }>;
  }> {
    const menuItemIds = items.map((item) => item.menuItemId);
    if (!menuItemIds.length) return { valid: true, insufficient: [] };
    const recipeRows = await inventoryRepository.findRequiredRecipeLines(tenantId, branchId, menuItemIds);

    const totals = new Map<string, { needed: number; available: number; name: string; menuItemIds: Set<string> }>();
    for (const item of items) {
      const needs = await resolveOrderItemRecipeNeeds(tenantId, branchId, recipeRows, item);
      for (const need of needs) {
        const current = totals.get(need.inventoryItemId);
        if (current) {
          current.needed += need.neededQuantity;
          current.menuItemIds.add(item.menuItemId);
        } else {
          totals.set(need.inventoryItemId, {
            needed: need.neededQuantity,
            available: need.currentStock,
            name: need.name,
            menuItemIds: new Set([item.menuItemId]),
          });
        }
      }
    }

    const insufficient: Array<{ menuItemId: string; inventoryItemId: string; name: string }> = [];
    for (const [inventoryItemId, total] of totals) {
      if (total.needed <= total.available) continue;
      const menuItemId = total.menuItemIds.values().next().value;
      if (menuItemId) insufficient.push({ menuItemId, inventoryItemId, name: total.name });
    }
    return { valid: insufficient.length === 0, insufficient };
  },

  // Read-only E6 aggregation. It deliberately consumes the same recursive
  // recipe resolver as stock validation/deduction, so recipe scope, sub-
  // recipes and yield can never drift between inventory and margin reports.
  async computeRecipeCost(
    tenantId: string,
    branchId: string,
    item: RecipeNeedItemInput,
  ) {
    const recipeRows = await inventoryRepository.findRequiredRecipeLines(
      tenantId, branchId, [item.menuItemId],
    );
    const needs = aggregateRawNeeds(
      await resolveOrderItemRecipeNeeds(
        tenantId,
        branchId,
        recipeRows,
        { ...item, quantity: 1 },
        false,
      ),
    );
    return Number(needs.reduce((sum, need) => sum + need.neededQuantity * need.costPerUnit, 0).toFixed(4));
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
    kitchenTicketId: string,
    items: InventoryOrderItemInput[],
    performedBy: string | null,
  ): Promise<{ deducted: number; short: Array<{ inventoryItemId: string; name: string }> }> {
    const menuItemIds = items.map((item) => item.menuItemId);
    if (!menuItemIds.length) return { deducted: 0, short: [] };
    const recipeRows = await inventoryRepository.findRequiredRecipeLines(tenantId, branchId, menuItemIds);
    if (!recipeRows.length) return { deducted: 0, short: [] };

    const lines: Array<{
      inventoryItemId: string;
      menuItemId: string;
      orderItemId: string;
      unit: InventoryUnit;
      neededQuantity: number;
    }> = [];

    for (const item of items) {
      const needs = await resolveOrderItemRecipeNeeds(tenantId, branchId, recipeRows, item);
      const aggregated = new Map<string, ResolvedRawNeed>();
      for (const need of needs) {
        const existing = aggregated.get(need.inventoryItemId);
        if (existing) existing.neededQuantity += need.neededQuantity;
        else aggregated.set(need.inventoryItemId, { ...need });
      }
      for (const need of aggregated.values()) {
        lines.push({
          inventoryItemId: need.inventoryItemId,
          menuItemId: item.menuItemId,
          orderItemId: item.orderItemId,
          unit: need.unit,
          neededQuantity: need.neededQuantity,
        });
      }
    }
    if (!lines.length) return { deducted: 0, short: [] };

    // Aggregate only within the same exact order item. This preserves E1
    // variant/modifier differences and gives E5 a lossless reversal trail.
    const aggregated = new Map<string, (typeof lines)[number]>();
    for (const line of lines) {
      const key = `${line.orderItemId}:${line.inventoryItemId}`;
      const existing = aggregated.get(key);
      if (existing) existing.neededQuantity += line.neededQuantity;
      else aggregated.set(key, { ...line });
    }

    const { deducted, touchedInventoryItemIds, short } = await inventoryRepository.deductRecipeLines(
      tenantId, branchId, orderId, kitchenTicketId, Array.from(aggregated.values()), performedBy,
    );

    if (touchedInventoryItemIds.length) {
      await inventoryService.syncMenuItemAvailability(tenantId, branchId, touchedInventoryItemIds);
      const touchedItems = await inventoryRepository.findByIds(tenantId, touchedInventoryItemIds);
      for (const inventoryItem of touchedItems) {
        if (parseFloat(inventoryItem.currentStock) <= parseFloat(inventoryItem.minimumStock)) {
          await eventBus.publish(
            { type: "inventory.low_stock", payload: toRealtimeInventoryItem(inventoryItem) },
            tenantId,
            branchId,
          );
        }
      }
    }
    return { deducted, short };
  },

  async clearRecipeAvailabilitySignals(
    tenantId: string,
    branchId: string,
    menuItemId: string,
  ) {
    const [variants, options] = await Promise.all([
      inventoryRepository.findScopedRecipeVariants(tenantId, branchId),
      inventoryRepository.findScopedRecipeModifierOptions(tenantId, branchId),
    ]);
    await availabilityService.applyInventoryItemSignal(tenantId, branchId, menuItemId, true);
    for (const variant of variants.filter((row) => row.menuItemId === menuItemId)) {
      await availabilityService.applyInventoryVariantSignal(tenantId, branchId, variant.id, true);
    }
    for (const option of options.filter((row) => row.menuItemId === menuItemId)) {
      await availabilityService.applyInventoryModifierSignal(
        tenantId, branchId, menuItemId, option.id, true,
      );
    }
  },

  async syncRecipeConfigurationAvailability(
    tenantId: string,
    branchId: string,
    menuItemId: string,
    previousVariantIds: string[] = [],
    previousModifierOptionIds: string[] = [],
  ) {
    const [recipeRows, items, currentVariants, currentOptions] = await Promise.all([
      inventoryRepository.findRequiredRecipeLines(tenantId, branchId, [menuItemId]),
      inventoryRepository.findMenuItemsForAvailability(tenantId, branchId, [menuItemId]),
      inventoryRepository.findScopedRecipeVariants(tenantId, branchId),
      inventoryRepository.findScopedRecipeModifierOptions(tenantId, branchId),
    ]);
    const item = items.find((row) => row.id === menuItemId);
    if (!item || !item.enableRecipeDeduction) return;

    const baseRows = recipeRows.filter((row) =>
      row.menuItemId === menuItemId && !row.variantId && !row.modifierOptionId,
    );
    const baseNeeds = await resolveOrderItemRecipeNeeds(tenantId, branchId, baseRows, {
      menuItemId, quantity: 1,
    });
    await availabilityService.applyInventoryItemSignal(
      tenantId, branchId, menuItemId, canSatisfyNeeds(baseNeeds),
    );

    const variantIds = new Set([
      ...previousVariantIds,
      ...currentVariants.filter((row) => row.menuItemId === menuItemId).map((row) => row.id),
    ]);
    for (const variantId of variantIds) {
      const variant = currentVariants.find((row) => row.id === variantId);
      if (variant && !variant.enableRecipeDeduction) continue;
      const scopedRows = recipeRows.filter((row) => row.variantId === variantId);
      const needs = await resolveOrderItemRecipeNeeds(tenantId, branchId, scopedRows, {
        menuItemId, variantId, quantity: 1,
      });
      await availabilityService.applyInventoryVariantSignal(
        tenantId, branchId, variantId, canSatisfyNeeds(needs),
      );
    }

    const modifierIds = new Set([
      ...previousModifierOptionIds,
      ...currentOptions.filter((row) => row.menuItemId === menuItemId).map((row) => row.id),
    ]);
    for (const optionId of modifierIds) {
      const option = currentOptions.find((row) => row.id === optionId);
      if (option && !option.enableRecipeDeduction) continue;
      const scopedRows = recipeRows.filter((row) => row.modifierOptionId === optionId);
      const needs = await resolveOrderItemRecipeNeeds(tenantId, branchId, scopedRows, {
        menuItemId, quantity: 1, selectedOptions: [{ optionId, quantity: 1 }],
      });
      await availabilityService.applyInventoryModifierSignal(
        tenantId, branchId, menuItemId, optionId, canSatisfyNeeds(needs),
      );
    }
  },

  // E4: recompute recipe-derived availability from the authoritative recipe
  // graph. The inventory ids are only a trigger; the branch sweep is deliberate
  // because a changed raw ingredient may be several levels below a sub-recipe.
  async syncMenuItemAvailability(
    tenantId: string,
    branchId: string,
    inventoryItemIds: string[],
  ) {
    if (!inventoryItemIds.length) return;

    const menuItemIds = await inventoryRepository.findAllRecipeMenuItemIds(tenantId, branchId);
    if (!menuItemIds.length) return;
    const recipeRows = await inventoryRepository.findRequiredRecipeLines(tenantId, branchId, menuItemIds);
    const items = await inventoryRepository.findMenuItemsForAvailability(tenantId, branchId, menuItemIds);

    for (const item of items) {
      if (!item.enableRecipeDeduction) continue;
      const baseRows = recipeRows.filter((row) =>
        row.menuItemId === item.id && !row.variantId && !row.modifierOptionId,
      );
      const needs = await resolveOrderItemRecipeNeeds(tenantId, branchId, baseRows, {
        menuItemId: item.id, quantity: 1,
      });
      await availabilityService.applyInventoryItemSignal(
        tenantId, branchId, item.id, canSatisfyNeeds(needs),
      );
    }

    // Inventory owns only the ingredient-sufficiency signal. AvailabilityService
    // owns computed-state persistence, manual precedence, audit and realtime.
    const variants = await inventoryRepository.findScopedRecipeVariants(tenantId, branchId);
    for (const variant of variants) {
      if (!variant.enableRecipeDeduction) continue;
      const scopedRows = recipeRows.filter((row) => row.variantId === variant.id);
      const needs = await resolveOrderItemRecipeNeeds(tenantId, branchId, scopedRows, {
        menuItemId: variant.menuItemId, variantId: variant.id, quantity: 1,
      });
      await availabilityService.applyInventoryVariantSignal(
        tenantId, branchId, variant.id, canSatisfyNeeds(needs),
      );
    }

    const options = await inventoryRepository.findScopedRecipeModifierOptions(tenantId, branchId);
    for (const option of options) {
      if (!option.enableRecipeDeduction) continue;
      const scopedRows = recipeRows.filter((row) => row.modifierOptionId === option.id);
      const needs = await resolveOrderItemRecipeNeeds(tenantId, branchId, scopedRows, {
        menuItemId: option.menuItemId, quantity: 1,
        selectedOptions: [{ optionId: option.id, quantity: 1 }],
      });
      await availabilityService.applyInventoryModifierSignal(
        tenantId, branchId, option.menuItemId, option.id, canSatisfyNeeds(needs),
      );
    }
  },
};
