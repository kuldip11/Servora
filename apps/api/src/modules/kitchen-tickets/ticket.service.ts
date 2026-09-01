import type { KitchenTicketStatus } from "@pos/types";
import type { AuthContext } from "@/core/auth";
import type { Logger } from "@/core/logger";
import { writeAudit } from "@/core/audit";
import { stationRepository } from "./stations/station.repository";
import { ticketRepository } from "./ticket.repository";
import { publishDetailedTicket, deductTicketWhenFired } from "./ticket-events";
import "./course-fire.listener";
import {
  assertValidTransition,
  timestampFieldsFor,
} from "./ticket-status.machine";
import { ticketNotFound, branchRequired } from "./ticket.errors";
import {
  assertKitchenTicketAccess,
  requireKitchenPermission,
  requireKitchenStatusPermission,
} from "./ticket-authorization";

export const ticketService = {
  async getQueueForCurrentBranch(auth: AuthContext, stationId?: string) {
    requireKitchenPermission(auth, "kitchen:read");
    const branchId = requireBranchOrThrow(auth);
    if (stationId) {
      const station = await stationRepository.findById(
        auth.tenantId,
        stationId,
      );
      if (!station || station.branchId !== branchId)
        throw ticketNotFound(stationId);
    }
    return ticketRepository.getQueue(auth.tenantId, branchId, stationId);
  },

  async listStationsForCurrentBranch(auth: AuthContext) {
    requireKitchenPermission(auth, "kitchen:read");
    const branchId = requireBranchOrThrow(auth);
    return stationRepository.list(auth.tenantId, branchId);
  },

  async updateStatus(
    auth: AuthContext,
    logger: Logger,
    ticketId: string,
    newStatus: KitchenTicketStatus,
  ) {
    requireKitchenStatusPermission(auth, newStatus);
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
    const detailed = await publishDetailedTicket(
      auth,
      ticketId,
      "kitchen.ticket.updated",
    );

    if (current.status === "HELD" && newStatus === "FIRED") {
      await deductTicketWhenFired(auth, detailed);
      await writeAudit({
        tenantId: auth.tenantId,
        userId: auth.userId,
        branchId: current.branchId,
        requestId: auth.requestId,
        ipAddress: auth.ipAddress,
        action: "KITCHEN_COURSE_MANUALLY_FIRED",
        entity: "kitchen_ticket",
        entityId: ticketId,
        metadata: {
          orderId: detailed.orderId,
          courseNumber: detailed.course?.courseNumber ?? null,
        },
      });
    }
    logger.info("Kitchen ticket status updated", {
      ticketId,
      from: current.status,
      to: newStatus,
    });
    return detailed;
  },
};

function requireBranchOrThrow(auth: AuthContext): string {
  if (!auth.branchId) throw branchRequired();
  return auth.branchId;
}
