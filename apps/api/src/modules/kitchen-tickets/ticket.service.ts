/**
 * Kitchen ticket service — orchestrates repository + status machine +
 * event publishing. This is where the business rules that used to live in
 * the repository (transition validity) and the controller (auth/branch
 * resolution, event publishing) now live, so both layers stay thin.
 */
import type { KitchenTicket, KitchenTicketStatus } from "@pos/types";
import type { AuthContext } from "../../core/auth";
import type { Logger } from "../../core/logger";
import { eventBus } from "../../lib/event-bus";
import { db } from "../../db";
import { orders } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import { ticketRepository } from "./ticket.repository";
import {
  assertValidTransition,
  timestampFieldsFor,
} from "./ticket-status.machine";
import { ticketNotFound, branchRequired } from "./ticket.errors";
import {
  assertKitchenTicketAccess,
  requireKitchenPermission,
} from "./ticket-authorization";

export const ticketService = {
  async getQueueForCurrentBranch(auth: AuthContext) {
    requireKitchenPermission(auth, "kitchen:read");
    const branchId = requireBranchOrThrow(auth);
    return ticketRepository.getQueue(auth.tenantId, branchId);
  },

  async updateStatus(
    auth: AuthContext,
    logger: Logger,
    ticketId: string,
    newStatus: KitchenTicketStatus,
  ) {
    requireKitchenPermission(auth, "kitchen:update");
    const current = await ticketRepository.findById(auth.tenantId, ticketId);
    if (!current) throw ticketNotFound(ticketId);
    assertKitchenTicketAccess(auth, current.branchId);

    assertValidTransition(current.status, newStatus);

    const updated = await ticketRepository.setStatus(
      auth.tenantId,
      ticketId,
      newStatus,
      timestampFieldsFor(newStatus),
    );
    if (!updated) throw ticketNotFound(ticketId);

    logger.info("Kitchen ticket status updated", {
      ticketId,
      from: current.status,
      to: newStatus,
    });

    const parentOrder = await db.query.orders.findFirst({
      where: and(eq(orders.id, updated.orderId), eq(orders.tenantId, auth.tenantId)),
      columns: { customerSessionId: true },
    });
    await eventBus.publish(
      {
        type: "kitchen.ticket.updated",
        payload: {
          ...(updated as unknown as KitchenTicket),
          customerSessionId: parentOrder?.customerSessionId ?? undefined,
        } as any,
      },
      auth.tenantId,
      updated.branchId,
    );

    return updated;
  },
};

function requireBranchOrThrow(auth: AuthContext): string {
  if (!auth.branchId) throw branchRequired();
  return auth.branchId;
}
