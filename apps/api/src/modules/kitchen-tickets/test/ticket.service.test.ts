import { beforeEach, describe, expect, it, vi } from "vitest";
const { getQueue, findById, findDetailedById, setStatus, publish, findOrder } = vi.hoisted(() => ({
  getQueue: vi.fn(),
  findById: vi.fn(),
  findDetailedById: vi.fn(),
  setStatus: vi.fn(),
  publish: vi.fn(),
  findOrder: vi.fn(),
}));
vi.mock("../ticket.repository", () => ({
  ticketRepository: { getQueue, findById, findDetailedById, setStatus },
}));
vi.mock("../../../lib/event-bus", () => ({ eventBus: { publish } }));
vi.mock("../../../db", () => ({
  db: { query: { orders: { findFirst: findOrder } } },
}));
import { ticketService } from "../ticket.service";
const auth = (overrides: any = {}) => ({
  userId: "u1",
  tenantId: "t1",
  branchId: "b1",
  email: "u@example.com",
  roles: [],
  permissions: ["kitchen:read", "kitchen:update"],
  ...overrides,
});
const logger = { info: vi.fn() } as any;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ticket service", () => {
  it("requires permission and a branch to read the queue", async () => {
    await expect(
      ticketService.getQueueForCurrentBranch(auth({ permissions: [] })),
    ).rejects.toThrow(/Insufficient permissions|access denied/);
    await expect(
      ticketService.getQueueForCurrentBranch(auth({ branchId: null })),
    ).rejects.toMatchObject({ code: "MISSING_BRANCH" });
    getQueue.mockResolvedValue([{ id: "t1" }]);
    await expect(
      ticketService.getQueueForCurrentBranch(auth()),
    ).resolves.toEqual([{ id: "t1" }]);
  });
  it("maps missing tickets and invalid transitions before mutating", async () => {
    findById.mockResolvedValue(undefined);
    await expect(
      ticketService.updateStatus(auth(), logger, "t1", "READY"),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    findById.mockResolvedValue({ id: "t1", branchId: "b1", status: "FIRED" });
    await expect(
      ticketService.updateStatus(auth(), logger, "t1", "READY"),
    ).rejects.toThrow("Cannot transition");
  });
  it("updates status, logs, and publishes the domain event", async () => {
    const current = { id: "t1", branchId: "b1", status: "PREPARING" };
    const updated = { ...current, status: "READY", orderId: "o1" };
    const detailed = {
      ...updated,
      items: [{ id: "i1", modifiers: [] }],
      order: { id: "o1", table: null },
    };
    findById.mockResolvedValue(current);
    setStatus.mockResolvedValue(updated);
    findOrder.mockResolvedValue({ customerSessionId: "cs1" });
    findDetailedById.mockResolvedValue(detailed);
    publish.mockResolvedValue(undefined);
    await expect(
      ticketService.updateStatus(auth(), logger, "t1", "READY"),
    ).resolves.toEqual(detailed);
    expect(logger.info).toHaveBeenCalledWith(
      "Kitchen ticket status updated",
      expect.objectContaining({
        ticketId: "t1",
        from: "PREPARING",
        to: "READY",
      }),
    );
    expect(publish).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "kitchen.ticket.updated",
        payload: expect.objectContaining({
          ...detailed,
          customerSessionId: "cs1",
        }),
      }),
      "t1",
      "b1",
    );
  });
  it("enforces resource branch access", async () => {
    findById.mockResolvedValue({
      id: "t1",
      branchId: "b2",
      status: "PREPARING",
    });
    await expect(
      ticketService.updateStatus(auth(), logger, "t1", "READY"),
    ).rejects.toThrow(/Insufficient permissions|access denied/);
  });
});
