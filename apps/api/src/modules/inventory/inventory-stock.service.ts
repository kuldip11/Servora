import type { AuthContext } from "@/core/auth";
import { ForbiddenError, NotFoundError, ValidationError } from "@/core/errors";
import { eventBus } from "@/lib/event-bus";
import {
  assertInventoryResourceBranch,
  requireInventoryPermission,
  requireInventoryTransactionPermission,
  resolveInventoryBranch,
} from "./inventory-authorization";
import { insufficientStock, inventoryItemNotFound } from "./inventory.errors";
import { inventoryRepository } from "./inventory.repository";
import { toRealtimeInventoryItem } from "./inventory-realtime";
import { inventoryRecipeService } from "./inventory-recipe.service";
import type {
  CreateInventoryItemInput,
  UpdateStockInput,
} from "./inventory.types";

export const inventoryStockService = {
  async list(auth: AuthContext) {
    requireInventoryPermission(auth, "inventory:read");
    if (auth.tenantWide && !auth.branchId) {
      return inventoryRepository.findAllBranches(auth.tenantId);
    }
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
      if (!input.wasteReasonId) {
        throw new ValidationError("A waste reason is required");
      }
      const reason = await inventoryRepository.findWasteReason(
        auth.tenantId,
        input.wasteReasonId,
      );
      if (!reason || !reason.isActive) {
        throw new ValidationError("Waste reason is invalid or inactive");
      }
      wasteReasonId = reason.id;
    } else if (input.wasteReasonId) {
      throw new ValidationError(
        "wasteReasonId is only valid for WASTE transactions",
      );
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
    if (
      parseFloat(result.item.currentStock) <=
      parseFloat(result.item.minimumStock)
    ) {
      await eventBus.publish(
        {
          type: "inventory.low_stock",
          payload: toRealtimeInventoryItem(result.item),
        },
        auth.tenantId,
        branchId,
      );
    }

    await inventoryRecipeService.syncMenuItemAvailability(
      auth.tenantId,
      branchId,
      [itemId],
    );
    return { item: result.item, transaction: result.transaction };
  },

  async lowStockAlerts(auth: AuthContext) {
    requireInventoryPermission(auth, "inventory:read");
    if (auth.tenantWide && !auth.branchId) {
      return inventoryRepository.findLowStockAllBranches(auth.tenantId);
    }
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
    if (!normalized) {
      throw new ValidationError("Waste reason label is required");
    }
    return inventoryRepository.createWasteReason(auth.tenantId, normalized);
  },

  async updateWasteReason(
    auth: AuthContext,
    id: string,
    input: { label?: string | undefined; isActive?: boolean | undefined },
  ) {
    requireInventoryPermission(auth, "inventory:update");
    const existing = await inventoryRepository.findWasteReason(
      auth.tenantId,
      id,
    );
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
    input: {
      quantity: number;
      wasteReasonId: string;
      notes?: string | undefined;
    },
  ) {
    if (!(input.quantity > 0)) {
      throw new ValidationError("Waste quantity must be greater than zero");
    }
    return inventoryStockService.updateStock(auth, itemId, {
      quantity: input.quantity,
      transactionType: "WASTE",
      wasteReasonId: input.wasteReasonId,
      ...(input.notes ? { notes: input.notes } : {}),
    });
  },

  async getOrderDeductions(orderId: string) {
    return inventoryRepository.findOrderDeductions(orderId);
  },
};
