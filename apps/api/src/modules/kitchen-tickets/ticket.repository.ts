import { eq, and, inArray } from "drizzle-orm";
import type { KitchenTicketStatus } from "@pos/types";
import { db } from "@/db";
import { kitchenTickets } from "@/db/schema";
import type { TicketTimestampPatch } from "./ticket-status.machine";

function projectStation<
  T extends {
    items: Array<{ stationId: string | null; menuItemId: string | null }>;
  },
>(ticket: T, stationId?: string) {
  if (!stationId) return ticket;
  const items = ticket.items.filter(
    (item) => item.stationId === null || item.stationId === stationId,
  );
  if (!items.some((item) => item.menuItemId !== null)) return null;
  return { ...ticket, items };
}

export const ticketRepository = {
  async getQueue(tenantId: string, branchId: string, stationId?: string) {
    const rows = await db.query.kitchenTickets.findMany({
      where: and(
        eq(kitchenTickets.tenantId, tenantId),
        eq(kitchenTickets.branchId, branchId),
        inArray(kitchenTickets.status, ["HELD", "FIRED", "PREPARING", "READY"]),
      ),
      with: {
        course: true,
        items: {
          with: { modifiers: true, station: true, comboSlotOption: true },
        },
        order: { with: { table: true } },
      },
      orderBy: kitchenTickets.createdAt,
    });
    return rows.flatMap((ticket) => {
      const projected = projectStation(ticket, stationId);
      return projected ? [projected] : [];
    });
  },

  findById(tenantId: string, ticketId: string) {
    return db.query.kitchenTickets.findFirst({
      where: and(
        eq(kitchenTickets.id, ticketId),
        eq(kitchenTickets.tenantId, tenantId),
      ),
      with: { course: true },
    });
  },

  findDetailedById(tenantId: string, ticketId: string) {
    return db.query.kitchenTickets.findFirst({
      where: and(
        eq(kitchenTickets.id, ticketId),
        eq(kitchenTickets.tenantId, tenantId),
      ),
      with: {
        course: true,
        items: {
          with: { modifiers: true, station: true, comboSlotOption: true },
        },
        order: { with: { table: true } },
      },
    });
  },

  async setStatus(
    tenantId: string,
    ticketId: string,
    status: KitchenTicketStatus,
    extraTimestamps: TicketTimestampPatch,
  ) {
    const [updated] = await db
      .update(kitchenTickets)
      .set({ status, updatedAt: new Date(), ...extraTimestamps })
      .where(
        and(
          eq(kitchenTickets.id, ticketId),
          eq(kitchenTickets.tenantId, tenantId),
        ),
      )
      .returning();
    return updated;
  },

  async allServed(tenantId: string, orderId: string) {
    const openTickets = await db.query.kitchenTickets.findMany({
      where: and(
        eq(kitchenTickets.tenantId, tenantId),
        eq(kitchenTickets.orderId, orderId),
      ),
      columns: { status: true },
    });
    return openTickets.every((ticket) => ticket.status === "SERVED");
  },

  async hasCourseNumber(
    tenantId: string,
    orderId: string,
    courseNumber: number,
  ) {
    const rows = await db.query.kitchenTickets.findMany({
      where: and(
        eq(kitchenTickets.tenantId, tenantId),
        eq(kitchenTickets.orderId, orderId),
      ),
      with: { course: true },
    });
    return rows.some((ticket) => ticket.course?.courseNumber === courseNumber);
  },

  async shouldHoldCourse(
    tenantId: string,
    orderId: string,
    courseNumber: number,
  ) {
    if (courseNumber <= 1) return false;
    const rows = await db.query.kitchenTickets.findMany({
      where: and(
        eq(kitchenTickets.tenantId, tenantId),
        eq(kitchenTickets.orderId, orderId),
      ),
      with: { course: true },
    });
    const prior = rows.filter(
      (ticket) => ticket.course?.courseNumber === courseNumber - 1,
    );
    return (
      prior.length === 0 || !prior.every((ticket) => ticket.status === "SERVED")
    );
  },

  async findAutoFireableHeldTickets(tenantId: string, orderId: string) {
    const rows = await db.query.kitchenTickets.findMany({
      where: and(
        eq(kitchenTickets.tenantId, tenantId),
        eq(kitchenTickets.orderId, orderId),
      ),
      with: { course: true },
    });
    return rows.filter((ticket) => {
      if (
        ticket.status !== "HELD" ||
        !ticket.course ||
        ticket.course.courseNumber <= 1
      )
        return false;
      const prior = rows.filter(
        (candidate) =>
          candidate.course?.courseNumber === ticket.course!.courseNumber - 1,
      );
      return (
        prior.length > 0 &&
        prior.every((candidate) => candidate.status === "SERVED")
      );
    });
  },
};
