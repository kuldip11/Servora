import type { Order } from '@pos/types';

export function shortOrderId(id: string): string {
  return `#${id.slice(-6).toUpperCase()}`;
}

export function formatCurrency(amount: number | string): string {
  return `₹${parseFloat(String(amount)).toFixed(2)}`;
}

export function isOrderReady(order: Order): boolean {
  return order.kitchenTickets?.some((t) => t.status === 'READY') ?? false;
}

export function isOrderActive(order: Order): boolean {
  return order.status === 'OPEN' || order.status === 'BILL_REQUESTED';
}
