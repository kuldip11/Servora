import type { OrderStatus } from "@pos/types";
import { DomainRuleError } from "@/core/errors";

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  OPEN: ["BILL_REQUESTED", "CANCELLED"],
  BILL_REQUESTED: ["PAID", "OPEN"],
  PAID: ["CLOSED"],
  CLOSED: [],
  CANCELLED: [],
};

export const canTransitionOrder = (
  from: OrderStatus,
  to: OrderStatus,
): boolean => {
  return (ORDER_STATUS_TRANSITIONS[from] ?? []).includes(to);
};

export const assertValidOrderTransition = (
  from: OrderStatus,
  to: OrderStatus,
): void => {
  if (!canTransitionOrder(from, to)) {
    throw new DomainRuleError(`Cannot transition order from ${from} to ${to}`, {
      from,
      to,
    });
  }
};
