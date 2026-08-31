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


export interface AddOrderComboInput {
  comboId: string;
  quantity?: number;
  selections: Array<{ slotId: string; optionIds: string[] }>;
}

export async function fetchOrders(): Promise<Order[]> {
  const res = await apiClient.get("/orders");
  return res.data.data;
}

export async function fetchOrder(orderId: string): Promise<Order> {
  const res = await apiClient.get(`/orders/${orderId}`);
  return res.data.data;
}

export async function updateOrderStatus(
  id: string,
  status: string,
  reason?: { cancellationReasonId?: string; reason?: string },
): Promise<void> {
  const validated = updateOrderStatusSchema.parse({ status });
  await apiClient.patch(`/orders/${id}/status`, { ...validated, ...reason });
}

export async function fetchCancellationReasons(): Promise<CancellationReason[]> {
  const res = await apiClient.get("/orders/cancellation-reasons", { params: { activeOnly: "true" } });
  return res.data.data;
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
  const res = await apiClient.post(`/orders/${orderId}/items`, validated);
  return res.data.data;
}

export async function updateTicketStatus(
  ticketId: string,
  status: string,
): Promise<void> {
  const validated = updateKitchenTicketStatusSchema.parse({ status });
  await apiClient.patch(`/kitchen-tickets/${ticketId}/status`, validated);
}

export async function refireOrderItem(orderId: string, orderItemId: string, reason: string, alsoCompOriginal = true): Promise<Order> {
  const res = await apiClient.post(`/orders/${orderId}/items/${orderItemId}/refire`, { reason, alsoCompOriginal });
  return res.data.data;
}


export async function refillOrderItem(orderId: string, orderItemId: string): Promise<Order> {
  const res = await apiClient.post(`/orders/${orderId}/items/${orderItemId}/refill`);
  return res.data.data;
}

export async function setOrderItemSeatShares(orderId: string, orderItemId: string, shares: Array<{ seatLabel: string; shareRatio: number }>): Promise<void> {
  await apiClient.put(`/orders/${orderId}/items/${orderItemId}/seat-shares`, { shares });
}

export async function voidOrderItem(
  orderId: string,
  orderItemId: string,
  reason: { cancellationReasonId?: string; reason?: string; approvalToken?: string },
): Promise<Order> {
  const res = await apiClient.post(`/orders/${orderId}/items/${orderItemId}/void`, reason);
  return res.data.data;
}

export async function compOrderItem(
  orderId: string,
  orderItemId: string,
  reason: { cancellationReasonId?: string; reason?: string; approvalToken?: string },
): Promise<Order> {
  const res = await apiClient.post(`/orders/${orderId}/items/${orderItemId}/comp`, reason);
  return res.data.data;
}

export async function transferOrderTable(
  orderId: string,
  newTableId: string,
  reason?: string,
): Promise<Order> {
  const res = await apiClient.post(`/orders/${orderId}/transfer-table`, {
    newTableId,
    ...(reason?.trim() ? { reason: reason.trim() } : {}),
  });
  return res.data.data;
}

export async function splitOrderBill(orderId: string, ways: number): Promise<void> {
  await apiClient.post(`/orders/${orderId}/bills/split`, { ways });
}
export async function splitOrderBillByItems(orderId: string, allocations: Array<{ label: string; orderItemIds: string[] }>): Promise<void> {
  await apiClient.post(`/orders/${orderId}/bills/split-items`, { allocations });
}
export async function splitOrderBillBySeat(orderId: string, sharedItemStrategy: "EVEN_SPLIT" | "MANUAL") {
  const response = await apiClient.post(`/orders/${orderId}/bills/split-seat`, { sharedItemStrategy });
  return response.data.data as { status: "CREATED" } | { status: "MANUAL_REQUIRED"; allocations: Array<{ label: string; orderItemIds: string[] }>; sharedItemIds: string[] };
}

export async function mergeOrders(sourceOrderId: string, targetOrderId: string): Promise<void> {
  await apiClient.post(`/orders/${sourceOrderId}/merge`, { targetOrderId });
}
