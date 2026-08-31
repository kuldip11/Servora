import type { AuthContext } from "../../core/auth";
import { createLogger } from "../../core/logger";
import { writeAudit } from "../../core/audit";
import { eventBus } from "../../lib/event-bus";
import { ticketRepository } from "./ticket.repository";
import { timestampFieldsFor } from "./ticket-status.machine";
import { deductTicketWhenFired, publishDetailedTicket } from "./ticket-events";

/**
 * Domain listener for a course reaching SERVED. The trigger is the same
 * `kitchen.ticket.updated` event already emitted for KDS realtime updates, so
 * course sequencing is event-driven rather than coupled to one controller or
 * status-service call path.
 */
export const courseFireListener = {
  async onPriorCourseServed(auth: AuthContext, orderId: string) {
    const held = await ticketRepository.findAutoFireableHeldTickets(auth.tenantId, orderId);
    const logger = createLogger(
      { userId: auth.userId, ...(auth.requestId ? { requestId: auth.requestId } : {}) },
      "kitchen-course-fire",
    );
    for (const ticket of held) {
      const fired = await ticketRepository.setStatus(auth.tenantId, ticket.id, "FIRED", timestampFieldsFor("FIRED"));
      if (!fired) continue;
      const detailed = await publishDetailedTicket(auth, ticket.id, "kitchen.ticket.updated");
      await deductTicketWhenFired(auth, detailed);
      logger.info("Kitchen course auto-fired", { ticketId: ticket.id, orderId, courseNumber: ticket.course?.courseNumber });
      await writeAudit({
        tenantId: auth.tenantId,
        userId: auth.userId,
        branchId: ticket.branchId,
        requestId: auth.requestId,
        ipAddress: auth.ipAddress,
        action: "KITCHEN_COURSE_AUTO_FIRED",
        entity: "kitchen_ticket",
        entityId: ticket.id,
        metadata: { orderId, courseNumber: ticket.course?.courseNumber ?? null },
      });
    }
  },
};

// Importing this module from ticket.service registers the domain listener once.
eventBus.subscribe("kitchen.ticket.updated", async ({ event, tenantId, branchId, context }) => {
  if (event.payload.status !== "SERVED") return;
  const resolvedBranchId = branchId ?? event.payload.branchId;
  const auth: AuthContext = {
    userId: context?.userId ?? "system",
    tenantId,
    branchId: resolvedBranchId,
    email: "system@servora.local",
    roles: [],
    permissions: [],
    requestId: context?.requestId,
    ipAddress: context?.ipAddress,
  };
  await courseFireListener.onPriorCourseServed(auth, event.payload.orderId);
});
