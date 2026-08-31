/** Single source of truth for kitchen ticket lifecycle transitions. */
import type { KitchenTicketStatus } from "@pos/types";
import { DomainRuleError } from "../../core/errors";

export const KITCHEN_TICKET_TRANSITIONS: Record<
  KitchenTicketStatus,
  KitchenTicketStatus[]
> = {
  PENDING_PAYMENT: ["FIRED"],
  HELD: ["FIRED"],
  FIRED: ["PREPARING"],
  PREPARING: ["READY"],
  READY: ["SERVED"],
  SERVED: [],
};

export function canTransition(from: KitchenTicketStatus, to: KitchenTicketStatus): boolean {
  return (KITCHEN_TICKET_TRANSITIONS[from] ?? []).includes(to);
}

export function assertValidTransition(from: KitchenTicketStatus, to: KitchenTicketStatus): void {
  if (!canTransition(from, to)) {
    throw new DomainRuleError(`Cannot transition kitchen ticket from ${from} to ${to}`, { from, to });
  }
}

export type TicketTimestampPatch = Partial<Record<"firedAt" | "readyAt" | "servedAt", Date | null>>;

export function timestampFieldsFor(status: KitchenTicketStatus): TicketTimestampPatch {
  if (status === "FIRED") return { firedAt: new Date() };
  if (status === "READY") return { readyAt: new Date() };
  if (status === "SERVED") return { servedAt: new Date() };
  return {};
}
