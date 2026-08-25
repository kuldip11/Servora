/**
 * Kitchen ticket repository — data access only.
 *
 * No business rules live here (status-transition validity is enforced in
 * `ticket.service.ts` via `ticket-status.machine.ts`). This mirrors the
 * target module structure: repository = queries, service = rules.
 */
import { eq, and, inArray } from 'drizzle-orm';
import type { KitchenTicketStatus } from '@pos/types';
import { db } from '../../db';
import { kitchenTickets } from '../../db/schema';

export const ticketRepository = {
  async getQueue(tenantId: string, branchId: string) {
    return db.query.kitchenTickets.findMany({
      where: and(
        eq(kitchenTickets.tenantId, tenantId),
        eq(kitchenTickets.branchId, branchId),
        inArray(kitchenTickets.status, ['FIRED', 'PREPARING', 'READY']),
      ),
      with: {
        items: { with: { modifiers: true } },
        order: { with: { table: true } },
      },
      orderBy: kitchenTickets.firedAt,
    });
  },

  async findById(tenantId: string, ticketId: string) {
    return db.query.kitchenTickets.findFirst({
      where: and(eq(kitchenTickets.id, ticketId), eq(kitchenTickets.tenantId, tenantId)),
    });
  },

  async setStatus(
    tenantId: string,
    ticketId: string,
    status: KitchenTicketStatus,
    extraTimestamps: Partial<Record<'readyAt' | 'servedAt', Date>>,
  ) {
    const [updated] = await db
      .update(kitchenTickets)
      .set({ status, updatedAt: new Date(), ...extraTimestamps })
      .where(and(eq(kitchenTickets.id, ticketId), eq(kitchenTickets.tenantId, tenantId)))
      .returning();

    return updated;
  },

  // Used to gate "Request Bill" — every ticket on the tab should be served
  // before the tab can move to billing.
  async allServed(tenantId: string, orderId: string) {
    const openTickets = await db.query.kitchenTickets.findMany({
      where: and(eq(kitchenTickets.tenantId, tenantId), eq(kitchenTickets.orderId, orderId)),
      columns: { status: true },
    });
    return openTickets.every((t) => t.status === 'SERVED');
  },
};
