import { apiClient } from '../../../shared/lib/api-client';
import type { Order } from '@pos/types';
import { addOrderItemsSchema, updateOrderStatusSchema, updateKitchenTicketStatusSchema } from '@pos/validation';

export interface AddOrderItemInput {
  menuItemId: string;
  variantId?: string;
  quantity: number;
  chefNotes?: string;
  selectedOptions?: Array<{ optionId: string; quantity?: number }>;
}

export async function fetchOrders(): Promise<Order[]> {
  const res = await apiClient.get('/orders');
  return res.data.data;
}

export async function fetchOrder(orderId: string): Promise<Order> {
  const res = await apiClient.get(`/orders/${orderId}`);
  return res.data.data;
}

export async function updateOrderStatus(id: string, status: string): Promise<void> {
  const validated = updateOrderStatusSchema.parse({ status });
  await apiClient.patch(`/orders/${id}/status`, validated);
}

export async function addOrderItems(
  orderId: string,
  items: AddOrderItemInput[],
  notes?: string,
): Promise<{ id: string }> {
  const validated = addOrderItemsSchema.parse({ items, ...(notes !== undefined ? { notes } : {}) });
  const res = await apiClient.post(`/orders/${orderId}/items`, validated);
  return res.data.data;
}

export async function updateTicketStatus(ticketId: string, status: string): Promise<void> {
  const validated = updateKitchenTicketStatusSchema.parse({ status });
  await apiClient.patch(`/kitchen-tickets/${ticketId}/status`, validated);
}
