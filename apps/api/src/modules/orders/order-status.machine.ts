/**
 * Order (tab) status machine — billing lifecycle only. Kitchen prep state
 * lives on kitchen_tickets and is managed by ticket-status.machine.ts /
 * ticket.service.ts instead.
 *
 * Extracted from orders/service.ts (where it lived as an inline
 * `VALID_TRANSITIONS` map) so it can be imported directly by tests instead
 * of duplicated, the same fix applied to the kitchen-ticket transitions.
 */
import type { OrderStatus } from "@pos/types";
import { DomainRuleError } from "../../core/errors";

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  OPEN: ["BILL_REQUESTED", "CANCELLED"],
  BILL_REQUESTED: ["PAID", "OPEN"],
  PAID: ["CLOSED"],
  CLOSED: [],
  CANCELLED: [],
};

export function canTransitionOrder(
  from: OrderStatus,
  to: OrderStatus,
): boolean {
  return (ORDER_STATUS_TRANSITIONS[from] ?? []).includes(to);
}

/** Throws `DomainRuleError` if `from -> to` isn't a valid order transition. */
export function assertValidOrderTransition(
  from: OrderStatus,
  to: OrderStatus,
): void {
  if (!canTransitionOrder(from, to)) {
    throw new DomainRuleError(`Cannot transition order from ${from} to ${to}`, {
      from,
      to,
    });
  }
}
