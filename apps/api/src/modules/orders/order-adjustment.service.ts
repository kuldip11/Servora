import type {
  KitchenTicket,
  Order,
  OrderType,
  RestaurantTable,
} from "@pos/types";
import type { AuthContext } from "../../core/auth";
import {
  requireOrdersPermission,
  assertOrderResourceAccess,
} from "./orders-authorization";
import { DomainRuleError, ValidationError } from "../../core/errors";
import { writeAudit } from "../../core/audit";
import { availabilityRepository } from "../menu/availability/availability.repository";
import { availabilityService } from "../menu/availability/availability.service";
import { tableRepository } from "../tables/table.repository";
import { ticketRepository } from "../kitchen-tickets/ticket.repository";
import { branchRepository } from "../branches/branch.repository";
import { tenantRepository } from "../tenants/tenant.repository";
import { inventoryService } from "../inventory/inventory.service";
import { eventBus } from "../../lib/event-bus";
import { orderRepository } from "./order.repository";
import { orderQueryService } from "./order-query.service";
import { orderTableService } from "./order-table.service";
import { orderStatusService } from "./order-status.service";
import {
  pricingPipeline,
  type OrderItemInput,
  type PricableMenuItem,
  type PricedLine,
} from "./pricing/pricing-pipeline";
import { menuResolver } from "../menu/menus/menu-resolver.service";
import { snapshotOrderLines } from "./order-line-snapshot.service";
import {
  priceComboOrders,
  type ComboOrderSelection,
} from "../menu/combos/combo-order.service";
import { promotionRepository } from "../menu/promotions/promotion.repository";
import { cancellationReasonService } from "./cancellation-reasons/cancellation-reason.service";
import { customerGroupRepository } from "../customer-groups/customer-group.repository";
import {
  finalizeWholeActiveOrder,
  storedOrderLineToStage4Snapshot,
  type StoredOrderLineForRepricing,
} from "./active-order-pricing";
import { isBillableOrderItem } from "./order-item-billing";
import { approvalService } from "../approvals/approval.service";
import { approvalAdjustmentValue } from "../approvals/approval-policy";
import {
  orderNotFound,
  branchRequiredForOrder,
  orderBranchNotFound,
  orderTypeDisabled,
  tableRequiredForDineIn,
  orderTableNotFound,
  tableOccupied,
  orderNotOpen,
  orderItemNotFound,
  orderItemCannotBeVoided,
  orderItemCannotBeComped,
  orderItemCannotBeRefired,
} from "./order.errors";

export const orderAdjustmentService = {
  async voidItem(
    auth: AuthContext,
    orderId: string,
    orderItemId: string,
    reason?: string | undefined,
    cancellationReasonId?: string | undefined,
    approvalToken?: string | undefined,
  ) {
    requireOrdersPermission(auth, "orders:void");
    if (!reason?.trim() && !cancellationReasonId) {
      throw new ValidationError("A void reason is required");
    }
    await cancellationReasonService.assertUsable(
      auth.tenantId,
      cancellationReasonId,
    );
    const order = await orderRepository.findById(auth.tenantId, orderId);
    if (!order) throw orderNotFound(orderId);
    assertOrderResourceAccess(auth, order.branchId);
    if (order.status !== "OPEN") {
      throw orderItemCannotBeVoided(
        "Items can only be voided on an open order",
      );
    }
    const item = order.items.find((candidate) => candidate.id === orderItemId);
    if (!item) throw orderItemNotFound(orderItemId);
    if (item.itemStatus !== "ACTIVE") {
      throw orderItemCannotBeVoided(
        "This item has already been voided or comped",
      );
    }
    const adjustmentValue = approvalAdjustmentValue(order.items, orderItemId);
    await approvalService.assertApproved(
      auth.tenantId,
      "VOID",
      orderId,
      orderItemId,
      adjustmentValue,
      approvalToken,
    );
    const ticket = order.kitchenTickets?.find((candidate) =>
      candidate.items?.some((ticketItem) => ticketItem.id === orderItemId),
    );
    if (ticket?.status === "SERVED") {
      throw orderItemCannotBeVoided("A served item cannot be voided");
    }

    const remaining = order.items.filter((candidate) => {
      const sameAdjustmentTarget = item.comboGroupId
        ? candidate.comboGroupId === item.comboGroupId
        : candidate.id === orderItemId;
      return !sameAdjustmentTarget && isBillableOrderItem(candidate);
    });
    const existingRedemptions =
      await promotionRepository.listRedemptionsForOrder(orderId);
    const pricingContext = {
      tenantId: auth.tenantId,
      branchId: order.branchId,
      channel: "STAFF" as const,
      fulfillmentType: order.type,
      asOf: new Date(),
      ...(order.customerId ? { customerId: order.customerId } : {}),
      ...(order.customerGroupId
        ? { customerGroupId: order.customerGroupId }
        : {}),
    };
    const repriced =
      order.billingMode === "PER_COVER"
        ? {
            subtotal: Number(order.subtotal),
            discountAmount: Number(order.discountAmount),
            taxAmount: Number(order.taxAmount),
            serviceChargeAmount: Number(order.serviceChargeAmount),
            roundingAdjustment: Number(order.roundingAdjustment),
            totalAmount: Number(order.totalAmount),
            existingPricingUpdates: [] as Array<{
              id: string;
              pricingAttribution: PricedLine["pricingAttribution"];
              taxMode: "INCLUSIVE" | "EXCLUSIVE";
            }>,
            redemptions: existingRedemptions,
          }
        : await finalizeWholeActiveOrder(
            pricingContext,
            remaining as StoredOrderLineForRepricing[],
            [],
            {
              ...(existingRedemptions.length
                ? {
                    promotionIds: existingRedemptions.map(
                      (entry) => entry.promotionId,
                    ),
                  }
                : {}),
              ...(order.customerId ? { customerId: order.customerId } : {}),
            },
          );
    const totals = {
      subtotal: repriced.subtotal,
      discountAmount: repriced.discountAmount,
      taxAmount: repriced.taxAmount,
      serviceChargeAmount: repriced.serviceChargeAmount,
      roundingAdjustment: repriced.roundingAdjustment,
      totalAmount: repriced.totalAmount,
      existingPricingUpdates: repriced.existingPricingUpdates,
      promotionRedemptions: repriced.redemptions,
    };
    const updated = await orderRepository.voidItem(
      auth.tenantId,
      orderId,
      orderItemId,
      auth.userId,
      reason?.trim() ?? "",
      cancellationReasonId,
      totals,
    );
    if (!updated) {
      throw orderItemCannotBeVoided(
        "This item has already been voided or comped",
      );
    }
    if (updated.reversedInventoryItemIds.length) {
      await inventoryService.syncMenuItemAvailability(
        auth.tenantId,
        order.branchId,
        updated.reversedInventoryItemIds,
      );
    }

    const fullOrder = await orderRepository.findById(auth.tenantId, orderId);
    await eventBus.publish(
      { type: "order.updated", payload: fullOrder as unknown as Order },
      auth.tenantId,
      order.branchId,
    );
    const updatedTicket = fullOrder?.kitchenTickets?.find(
      (candidate) => candidate.id === ticket?.id,
    );
    if (updatedTicket) {
      await eventBus.publish(
        {
          type: "order.item.voided",
          payload: updatedTicket as unknown as KitchenTicket,
        },
        auth.tenantId,
        order.branchId,
      );
    }
    return fullOrder;
  },

  async compItem(
    auth: AuthContext,
    orderId: string,
    orderItemId: string,
    reason?: string | undefined,
    cancellationReasonId?: string | undefined,
    approvalToken?: string | undefined,
  ) {
    requireOrdersPermission(auth, "orders:comp");
    if (!reason?.trim() && !cancellationReasonId) {
      throw new ValidationError("A comp reason is required");
    }
    await cancellationReasonService.assertUsable(
      auth.tenantId,
      cancellationReasonId,
    );
    const order = await orderRepository.findById(auth.tenantId, orderId);
    if (!order) throw orderNotFound(orderId);
    assertOrderResourceAccess(auth, order.branchId);
    if (order.status !== "OPEN") {
      throw orderItemCannotBeComped(
        "Items can only be comped on an open order",
      );
    }
    const item = order.items.find((candidate) => candidate.id === orderItemId);
    if (!item) throw orderItemNotFound(orderItemId);
    if (item.itemStatus !== "ACTIVE") {
      throw orderItemCannotBeComped(
        "This item has already been voided or comped",
      );
    }
    const adjustmentValue = approvalAdjustmentValue(order.items, orderItemId);
    await approvalService.assertApproved(
      auth.tenantId,
      "COMP",
      orderId,
      orderItemId,
      adjustmentValue,
      approvalToken,
    );

    const remaining = order.items.filter((candidate) => {
      const sameAdjustmentTarget = item.comboGroupId
        ? candidate.comboGroupId === item.comboGroupId
        : candidate.id === orderItemId;
      return !sameAdjustmentTarget && isBillableOrderItem(candidate);
    });
    const existingRedemptions =
      await promotionRepository.listRedemptionsForOrder(orderId);
    const pricingContext = {
      tenantId: auth.tenantId,
      branchId: order.branchId,
      channel: "STAFF" as const,
      fulfillmentType: order.type,
      asOf: new Date(),
      ...(order.customerId ? { customerId: order.customerId } : {}),
      ...(order.customerGroupId
        ? { customerGroupId: order.customerGroupId }
        : {}),
    };
    const repriced =
      order.billingMode === "PER_COVER"
        ? {
            subtotal: Number(order.subtotal),
            discountAmount: Number(order.discountAmount),
            taxAmount: Number(order.taxAmount),
            serviceChargeAmount: Number(order.serviceChargeAmount),
            roundingAdjustment: Number(order.roundingAdjustment),
            totalAmount: Number(order.totalAmount),
            existingPricingUpdates: [] as Array<{
              id: string;
              pricingAttribution: PricedLine["pricingAttribution"];
              taxMode: "INCLUSIVE" | "EXCLUSIVE";
            }>,
            redemptions: existingRedemptions,
          }
        : await finalizeWholeActiveOrder(
            pricingContext,
            remaining as StoredOrderLineForRepricing[],
            [],
            {
              ...(existingRedemptions.length
                ? {
                    promotionIds: existingRedemptions.map(
                      (entry) => entry.promotionId,
                    ),
                  }
                : {}),
              ...(order.customerId ? { customerId: order.customerId } : {}),
            },
          );
    const totals = {
      subtotal: repriced.subtotal,
      discountAmount: repriced.discountAmount,
      taxAmount: repriced.taxAmount,
      serviceChargeAmount: repriced.serviceChargeAmount,
      roundingAdjustment: repriced.roundingAdjustment,
      totalAmount: repriced.totalAmount,
      existingPricingUpdates: repriced.existingPricingUpdates,
      promotionRedemptions: repriced.redemptions,
    };
    const updated = await orderRepository.compItem(
      auth.tenantId,
      orderId,
      orderItemId,
      auth.userId,
      reason?.trim() ?? "",
      cancellationReasonId,
      totals,
    );
    if (!updated) {
      throw orderItemCannotBeComped(
        "This item has already been voided or comped",
      );
    }

    const fullOrder = await orderRepository.findById(auth.tenantId, orderId);
    await eventBus.publish(
      { type: "order.updated", payload: fullOrder as unknown as Order },
      auth.tenantId,
      order.branchId,
    );
    return fullOrder;
  },

};
