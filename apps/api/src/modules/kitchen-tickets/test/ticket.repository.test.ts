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
});
