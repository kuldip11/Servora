/**
 * Kitchen ticket status machine.
 *
 * Single source of truth for valid status transitions — imported by both
 * `ticket.service.ts` (to enforce it) and the test suite (to lock it in),
 * so production logic and tests can never drift apart the way the old
 * duplicated `TICKET_TRANSITIONS` map in `core-foundation.test.ts` did.
 */
import type { KitchenTicketStatus } from '@pos/types';
import { DomainRuleError } from '../../core/errors';

export const KITCHEN_TICKET_TRANSITIONS: Record<KitchenTicketStatus, KitchenTicketStatus[]> = {
  FIRED: ['PREPARING'],
  PREPARING: ['READY'],
  // Chef's job ends at READY — SERVED is the waiter's action. Not restricted
  // by role here (that's a controller/service concern); this machine only
  // encodes which *sequence* of statuses is valid.
  READY: ['SERVED'],
  SERVED: [],
};

export function canTransition(from: KitchenTicketStatus, to: KitchenTicketStatus): boolean {
  return (KITCHEN_TICKET_TRANSITIONS[from] ?? []).includes(to);
}

/** Throws `DomainRuleError` if `from -> to` isn't a valid transition. */
export function assertValidTransition(from: KitchenTicketStatus, to: KitchenTicketStatus): void {
  if (!canTransition(from, to)) {
    throw new DomainRuleError(`Cannot transition kitchen ticket from ${from} to ${to}`, {
      from,
      to,
    });
  }
}

/** Timestamp fields to stamp when entering a given status, beyond `updatedAt`. */
export function timestampFieldsFor(status: KitchenTicketStatus): Partial<Record<'readyAt' | 'servedAt', Date>> {
  if (status === 'READY') return { readyAt: new Date() };
  if (status === 'SERVED') return { servedAt: new Date() };
  return {};
}
