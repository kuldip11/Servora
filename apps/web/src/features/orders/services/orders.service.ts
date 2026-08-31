import { apiClient } from "../../../shared/lib/api-client";
import type { Order } from "@pos/types";
import type { CartItem } from "../utils/cartTypes";

export interface OrdersListFilters {
  status?: string;
  type?: string;
}

export interface CreateOrderInput {
  type: string;
  tableId?: string | undefined;
  notes?: string | undefined;
  items: CartItemPayload[];
}

export interface AddOrderItemsInput {
  notes?: string | undefined;
  items: CartItemPayload[];
}

interface CartItemPayload {
  menuItemId: string;
  quantity: number;
  variantId?: string | undefined;
  chefNotes?: string | undefined;
  seatLabel?: string | undefined;
  courseNumber?: number | undefined;
  selectedOptions: { optionId: string; quantity: number }[];
}

export function toCartItemPayload(item: CartItem): CartItemPayload {
  return {
    menuItemId: item.menuItemId,
    quantity: item.quantity,
    ...(item.variantId !== undefined && { variantId: item.variantId }),
    ...(item.chefNotes && { chefNotes: item.chefNotes }),
    ...(item.seatLabel && { seatLabel: item.seatLabel }),
    ...(item.courseNumber !== undefined && { courseNumber: item.courseNumber }),
    selectedOptions: item.modifiers.map((m) => ({
      optionId: m.optionId,
      quantity: m.quantity,
    })),
  };
}

export const ordersService = {
  async list(filters: OrdersListFilters): Promise<Order[]> {
    const params: Record<string, string> = {};
    if (filters.status) params["status"] = filters.status;
    if (filters.type) params["type"] = filters.type;
    const res = await apiClient.get("/orders", { params });
    return res.data.data;
  },

  async detail(orderId: string): Promise<Order> {
    const res = await apiClient.get(`/orders/${orderId}`);
    return res.data.data;
  },

  async create(input: CreateOrderInput): Promise<Order> {
    const res = await apiClient.post("/orders", input);
    return res.data.data;
  },

  async addItems(orderId: string, input: AddOrderItemsInput): Promise<Order> {
    const res = await apiClient.post(`/orders/${orderId}/items`, input);
    return res.data.data;
  },

  async updateStatus(orderId: string, status: string, reason?: { cancellationReasonId?: string; reason?: string }): Promise<Order> {
    const res = await apiClient.patch(`/orders/${orderId}/status`, { status, ...reason });
    return res.data.data;
  },

  async updateTicketStatus(ticketId: string, status: string): Promise<void> {
    await apiClient.patch(`/kitchen-tickets/${ticketId}/status`, { status });
  },

  async refireItem(orderId: string, orderItemId: string, reason: string, alsoCompOriginal = true): Promise<Order> {
    const res = await apiClient.post(`/orders/${orderId}/items/${orderItemId}/refire`, { reason, alsoCompOriginal });
    return res.data.data;
  },

  async voidItem(orderId: string, orderItemId: string, reason: { cancellationReasonId?: string; reason?: string; approvalToken?: string }): Promise<Order> {
    const res = await apiClient.post(`/orders/${orderId}/items/${orderItemId}/void`, reason);
    return res.data.data;
  },
  async compItem(orderId: string, orderItemId: string, reason: { cancellationReasonId?: string; reason?: string; approvalToken?: string }): Promise<Order> {
    const res = await apiClient.post(`/orders/${orderId}/items/${orderItemId}/comp`, reason);
    return res.data.data;
  },
  async transferTable(orderId: string, newTableId: string, reason?: string): Promise<Order> {
    const res = await apiClient.post(`/orders/${orderId}/transfer-table`, {
      newTableId,
      ...(reason?.trim() ? { reason: reason.trim() } : {}),
    });
    return res.data.data;
  },
  async mergeOrders(sourceOrderId: string, targetOrderId: string): Promise<void> {
    await apiClient.post(`/orders/${sourceOrderId}/merge`, { targetOrderId });
  },
};
