import { beforeEach, describe, expect, it, vi } from "vitest";

const handlers = vi.hoisted(() => new Map<string, (event: any) => void>());
const queryClient = vi.hoisted(() => ({
  invalidateQueries: vi.fn(),
  setQueryData: vi.fn(),
}));

vi.mock("../../../../shared/lib/realtime", () => ({
  useRealtimeEvent: vi.fn((type: string, handler: (event: any) => void) =>
    handlers.set(type, handler),
  ),
}));
vi.mock("../../../../shared/lib/query-client", () => ({ queryClient }));
vi.mock("../../query-keys", () => ({
  orderKeys: {
    lists: () => ["orders", "list"],
    detail: (id: string) => ["orders", id],
  },
}));

import { useOrdersRealtimeSync } from "../useOrdersRealtimeSync";

describe("order realtime synchronization", () => {
  beforeEach(() => {
    handlers.clear();
    vi.clearAllMocks();
    useOrdersRealtimeSync();
  });

  it("updates list and detail caches for created and updated orders", () => {
    const created = { id: "o1", status: "OPEN" };
    const updated = { id: "o1", status: "READY" };

    handlers.get("order.created")?.({
      type: "order.created",
      payload: created,
    });
    handlers.get("order.updated")?.({
      type: "order.updated",
      payload: updated,
    });

    expect(queryClient.setQueryData).toHaveBeenCalledWith(
      ["orders", "o1"],
      created,
    );
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["orders", "list"],
      refetchType: "active",
    });
  });

  it("updates an existing kitchen ticket while preserving unrelated tickets", () => {
    const existing = {
      id: "o1",
      updatedAt: "2026-08-25T11:00:00Z",
      kitchenTickets: [
        { id: "t1", status: "NEW" },
        { id: "t2", status: "READY" },
      ],
    };
    const ticket = {
      id: "t1",
      status: "PREPARING",
      updatedAt: "2026-08-25T12:00:00Z",
    };

    handlers.get("kitchen.ticket.updated")?.({
      type: "kitchen.ticket.updated",
      payload: { ...ticket, orderId: "o1" },
    });
    const updater = queryClient.setQueryData.mock.calls[0]?.[1] as (
      current: typeof existing,
    ) => typeof existing;
    const result = updater(existing);

    expect(result.kitchenTickets).toEqual([
      { ...ticket, orderId: "o1" },
      existing.kitchenTickets[1],
    ]);
    expect(result.updatedAt).toBe(ticket.updatedAt);
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["orders", "list"],
      refetchType: "active",
    });
  });

  it("returns an order unchanged when no kitchen tickets are cached", () => {
    handlers.get("kitchen.ticket.updated")?.({
      type: "kitchen.ticket.updated",
      payload: { id: "t1", orderId: "o1", status: "READY", updatedAt: "now" },
    });
    const updater = queryClient.setQueryData.mock.calls[0]?.[1] as (current: {
      id: string;
    }) => unknown;
    const current = { id: "o1" };
    expect(updater(current)).toBe(current);
  });
});
