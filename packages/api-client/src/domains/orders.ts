import type { CancellationReason, Order } from "@pos/types";
import type { AddOrderItemsInput, CreateOrderInput, UpdateOrderStatusInput, UpdateKitchenTicketStatusInput } from "@pos/validation";
import { getDomainData, patchDomainData, postDomainData, type DomainHttpClient } from "./shared";

export interface OrdersListFilters {
  status?: string;
  type?: string;
}


export interface OrderAdjustmentReason {
  cancellationReasonId?: string;
  reason?: string;
  approvalToken?: string;
}

export function createOrdersApi(client: DomainHttpClient) {
  return {
    list(filters: OrdersListFilters = {}): Promise<Order[]> {
      const params: Record<string, string> = {};
      if (filters.status) params["status"] = filters.status;
      if (filters.type) params["type"] = filters.type;
      return getDomainData<Order[]>(client, "/orders", { params });
    },
    get(orderId: string): Promise<Order> {
      return getDomainData<Order>(client, `/orders/${orderId}`);
    },
    create(input: CreateOrderInput): Promise<Order> {
      return postDomainData<Order>(client, "/orders", input);
    },
    addItems(orderId: string, input: AddOrderItemsInput): Promise<Order> {
      return postDomainData<Order>(client, `/orders/${orderId}/items`, input);
    },
    updateStatus(orderId: string, input: UpdateOrderStatusInput & { cancellationReasonId?: string }): Promise<Order> {
      return patchDomainData<Order>(client, `/orders/${orderId}/status`, input);
    },
    updateTicketStatus(ticketId: string, input: UpdateKitchenTicketStatusInput): Promise<void> {
      return client.patch(`/kitchen-tickets/${ticketId}/status`, input).then(() => undefined);
    },
    refireItem(orderId: string, orderItemId: string, reason: string, alsoCompOriginal = true): Promise<Order> {
      return postDomainData<Order>(client, `/orders/${orderId}/items/${orderItemId}/refire`, { reason, alsoCompOriginal });
    },
    refillItem(orderId: string, orderItemId: string): Promise<Order> {
      return postDomainData<Order>(client, `/orders/${orderId}/items/${orderItemId}/refill`);
    },
    voidItem(orderId: string, orderItemId: string, reason: OrderAdjustmentReason): Promise<Order> {
      return postDomainData<Order>(client, `/orders/${orderId}/items/${orderItemId}/void`, reason);
    },
    compItem(orderId: string, orderItemId: string, reason: OrderAdjustmentReason): Promise<Order> {
      return postDomainData<Order>(client, `/orders/${orderId}/items/${orderItemId}/comp`, reason);
    },
    transferTable(orderId: string, newTableId: string, reason?: string): Promise<Order> {
      return postDomainData<Order>(client, `/orders/${orderId}/transfer-table`, {
        newTableId,
        ...(reason?.trim() ? { reason: reason.trim() } : {}),
      });
    },
    merge(sourceOrderId: string, targetOrderId: string): Promise<void> {
      return client.post(`/orders/${sourceOrderId}/merge`, { targetOrderId }).then(() => undefined);
    },
    listCancellationReasons(): Promise<CancellationReason[]> {
      return getDomainData<CancellationReason[]>(client, "/orders/cancellation-reasons", { params: { activeOnly: "true" } });
    },
    setItemSeatShares(orderId: string, orderItemId: string, shares: Array<{ seatLabel: string; shareRatio: number }>): Promise<void> {
      return client.put(`/orders/${orderId}/items/${orderItemId}/seat-shares`, { shares }).then(() => undefined);
    },
    listAllCancellationReasons(): Promise<CancellationReason[]> {
      return getDomainData<CancellationReason[]>(client, "/orders/cancellation-reasons");
    },
    createCancellationReason(label: string): Promise<CancellationReason> {
      return postDomainData<CancellationReason>(client, "/orders/cancellation-reasons", { label });
    },
    updateCancellationReason(id: string, patch: Record<string, unknown>): Promise<CancellationReason> {
      return patchDomainData<CancellationReason>(client, `/orders/cancellation-reasons/${id}`, patch);
    },
    explain<T>(orderId: string): Promise<T> {
      return getDomainData<T>(client, `/orders/${orderId}/explain`);
    },
  };
}
