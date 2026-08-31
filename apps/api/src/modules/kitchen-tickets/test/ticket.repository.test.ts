import { beforeEach, describe, expect, it, vi } from "vitest";
const { findMany, findFirst } = vi.hoisted(() => ({
  findMany: vi.fn(),
  findFirst: vi.fn(),
}));
const { db } = vi.hoisted(() => ({
  db: { query: { kitchenTickets: { findMany, findFirst } }, update: vi.fn() },
}));
vi.mock("../../../db", () => ({ db }));
import { ticketRepository } from "../ticket.repository";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ticket repository", () => {
  it("queries the current tenant/branch queue and ticket by id", async () => {
    findMany.mockResolvedValue([{ id: "t1", status: "READY" }]);
    findFirst.mockResolvedValue({
      id: "t1",
      tenantId: "t1",
      branchId: "b1",
      status: "READY",
    });
    await expect(ticketRepository.getQueue("t1", "b1")).resolves.toEqual([
      { id: "t1", status: "READY" },
    ]);
    await expect(ticketRepository.findById("t1", "t1")).resolves.toMatchObject({
      id: "t1",
    });
  });
  it("updates status with timestamp fields and returns the row", async () => {
    const updated = { id: "t1", status: "READY" };
    db.update.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([updated]),
        }),
      }),
    });
    await expect(
      ticketRepository.setStatus("t1", "t1", "READY", { readyAt: new Date() }),
    ).resolves.toEqual(updated);
  });
  it("reports whether every ticket for an order is served", async () => {
    findMany.mockResolvedValue([{ status: "SERVED" }, { status: "SERVED" }]);
    await expect(ticketRepository.allServed("t1", "o1")).resolves.toBe(true);
    findMany.mockResolvedValue([{ status: "SERVED" }, { status: "READY" }]);
    await expect(ticketRepository.allServed("t1", "o1")).resolves.toBe(false);
  });
  it("filters a station queue but keeps unassigned fallback lines", async () => {
    findMany.mockResolvedValue([{ id: "t1", status: "FIRED", items: [
      { id: "i1", menuItemId: "m1", stationId: "s1" },
      { id: "i2", menuItemId: "m2", stationId: "s2" },
      { id: "i3", menuItemId: "m3", stationId: null },
    ] }]);
    const rows = await ticketRepository.getQueue("t1", "b1", "s1");
    expect(rows[0]?.items.map((item) => item.id)).toEqual(["i1", "i3"]);
  });

  it("reports whether an order already contains the requested course", async () => {
    findMany.mockResolvedValue([
      { id: "c1", status: "SERVED", course: { courseNumber: 1 } },
    ]);
    await expect(ticketRepository.hasCourseNumber("t1", "o1", 1)).resolves.toBe(true);
    await expect(ticketRepository.hasCourseNumber("t1", "o1", 2)).resolves.toBe(false);
  });

  it("holds later courses until the immediately prior course is served", async () => {
    findMany.mockResolvedValue([
      { id: "c1", status: "READY", course: { courseNumber: 1 } },
      { id: "c2", status: "HELD", course: { courseNumber: 2 } },
    ]);
    await expect(ticketRepository.shouldHoldCourse("t1", "o1", 2)).resolves.toBe(true);
    findMany.mockResolvedValue([
      { id: "c1", status: "SERVED", course: { courseNumber: 1 } },
      { id: "c2", status: "HELD", course: { courseNumber: 2 } },
    ]);
    await expect(ticketRepository.shouldHoldCourse("t1", "o1", 2)).resolves.toBe(false);
    await expect(ticketRepository.findAutoFireableHeldTickets("t1", "o1")).resolves.toMatchObject([{ id: "c2" }]);
  });

});
