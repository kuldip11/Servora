import type { AuthContext } from "@/core/auth";
import { inventoryService } from "@/modules/inventory/inventory.service";
import {
  assertOrderListScope,
  assertOrderResourceAccess,
  requireOrdersPermission,
} from "./orders-authorization";
import { orderNotFound } from "./order.errors";
import { orderRepository } from "./order.repository";

export const orderQueryService = {
  async list(
    auth: AuthContext,
    filters?: { status?: string | undefined; type?: string | undefined },
  ) {
    requireOrdersPermission(auth, "orders:read");
    assertOrderListScope(auth);
    return orderRepository.findMany(auth.tenantId, auth.branchId, filters);
  },

  async getById(auth: AuthContext, orderId: string) {
    requireOrdersPermission(auth, "orders:read");
    const order = await orderRepository.findById(auth.tenantId, orderId);
    if (!order) throw orderNotFound(orderId);
    assertOrderResourceAccess(auth, order.branchId);
    return order;
  },

  async getInventoryImpact(auth: AuthContext, orderId: string) {
    requireOrdersPermission(auth, "orders:read");
    const order = await orderRepository.findById(auth.tenantId, orderId);
    if (!order) throw orderNotFound(orderId);
    assertOrderResourceAccess(auth, order.branchId);
    return inventoryService.getOrderDeductions(orderId);
  },
};
