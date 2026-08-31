import { createBillingApi, createOrdersApi } from "@pos/api-client";
import { apiClient } from "../../../shared/lib/api-client";
import type { CancellationReason, Order } from "@pos/types";
import {
  addOrderItemsSchema,
  updateOrderStatusSchema,
  updateKitchenTicketStatusSchema,
} from "@pos/validation";

export interface AddOrderItemInput {
  menuItemId: string;
  variantId?: string;
  quantity: number;
  chefNotes?: string;
  seatLabel?: string;
  courseNumber?: number;
  weightQuantity?: number;
  manualPrice?: number;
  selectedOptions?: Array<{ optionId: string; quantity?: number; zoneLabel?: string }>;
}


const ordersApi = createOrdersApi(apiClient);
const billingApi = createBillingApi(apiClient);

export interface AddOrderComboInput {
  comboId: string;
  quantity?: number;
  selections: Array<{ slotId: string; optionIds: string[] }>;
}

export async function fetchOrders(): Promise<Order[]> {
  return ordersApi.list();
}

export async function fetchOrder(orderId: string): Promise<Order> {
  return ordersApi.get(orderId);
}

export async function updateOrderStatus(
  id: string,
  status: string,
  reason?: { cancellationReasonId?: string; reason?: string },
): Promise<void> {
  const validated = updateOrderStatusSchema.parse({ status });
  await ordersApi.updateStatus(id, { ...validated, ...reason });
}

export async function fetchCancellationReasons(): Promise<CancellationReason[]> {
  return ordersApi.listCancellationReasons();
}

export async function addOrderItems(
  orderId: string,
  items: AddOrderItemInput[],
  combos: AddOrderComboInput[],
  notes?: string,
  pricing?: { couponCode?: string; promotionIds?: string[] },
): Promise<{ id: string }> {
  const validated = addOrderItemsSchema.parse({
    ...(items.length ? { items } : {}),
    ...(combos.length ? { combos } : {}),
    ...(notes !== undefined ? { notes } : {}),
    ...(pricing?.couponCode ? { couponCode: pricing.couponCode } : {}),
    ...(pricing?.promotionIds?.length ? { promotionIds: pricing.promotionIds } : {}),
  });
  return ordersApi.addItems(orderId, validated);
}

export async function updateTicketStatus(
  ticketId: string,
  status: string,
): Promise<void> {
  const validated = updateKitchenTicketStatusSchema.parse({ status });
  await ordersApi.updateTicketStatus(ticketId, validated);
}

export async function refireOrderItem(orderId: string, orderItemId: string, reason: string, alsoCompOriginal = true): Promise<Order> {
  return ordersApi.refireItem(orderId, orderItemId, reason, alsoCompOriginal);
}


export async function refillOrderItem(orderId: string, orderItemId: string): Promise<Order> {
  return ordersApi.refillItem(orderId, orderItemId);
}

export async function setOrderItemSeatShares(orderId: string, orderItemId: string, shares: Array<{ seatLabel: string; shareRatio: number }>): Promise<void> {
  await ordersApi.setItemSeatShares(orderId, orderItemId, shares);
}

export async function voidOrderItem(
  orderId: string,
  orderItemId: string,
  reason: { cancellationReasonId?: string; reason?: string; approvalToken?: string },
): Promise<Order> {
  return ordersApi.voidItem(orderId, orderItemId, reason);
}

export async function compOrderItem(
  orderId: string,
  orderItemId: string,
  reason: { cancellationReasonId?: string; reason?: string; approvalToken?: string },
): Promise<Order> {
  return ordersApi.compItem(orderId, orderItemId, reason);
}

export async function transferOrderTable(
  orderId: string,
  newTableId: string,
  reason?: string,
): Promise<Order> {
  return ordersApi.transferTable(orderId, newTableId, reason);
}

export async function splitOrderBill(orderId: string, ways: number): Promise<void> {
  await billingApi.splitOrder(orderId, ways);
}
export async function splitOrderBillByItems(orderId: string, allocations: Array<{ label: string; orderItemIds: string[] }>): Promise<void> {
  await billingApi.splitOrderByItems(orderId, allocations);
}
export async function splitOrderBillBySeat(orderId: string, sharedItemStrategy: "EVEN_SPLIT" | "MANUAL") {
  return billingApi.splitOrderBySeat(orderId, sharedItemStrategy);
}

export async function mergeOrders(sourceOrderId: string, targetOrderId: string): Promise<void> {
  await ordersApi.merge(sourceOrderId, targetOrderId);
}
