import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  setQueryData: vi.fn(),
  useQueryClient: vi.fn(),
  handlers: [] as Array<[string, (event: any) => void]>,
}));

mocks.useQueryClient.mockReturnValue({ setQueryData: mocks.setQueryData });
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: mocks.useQueryClient,
}));
vi.mock("../../../../shared/lib/realtime", () => ({
  useConnectionStatus: () => true,
  useRealtimeEvent: (type: string, handler: (event: any) => void) =>
    mocks.handlers.push([type, handler]),
}));

import { useKitchenRealtime } from "../useKitchenRealtime";
import { KITCHEN_TICKETS_QUERY_KEY } from "../useKitchenTickets";

describe("useKitchenRealtime", () => {
  it("upserts full ticket payloads directly into the KDS cache", () => {
    expect(useKitchenRealtime()).toEqual({ connected: true });
    expect(mocks.handlers.map(([type]) => type)).toEqual([
      "kitchen.ticket.created",
      "kitchen.ticket.updated",
    ]);
    const ticket = {
      id: "t1",
      status: "FIRED",
      firedAt: "2026-08-27T10:00:00.000Z",
    };
    mocks.handlers[0]![1]({ type: "kitchen.ticket.created", payload: ticket });
    expect(mocks.setQueryData).toHaveBeenCalledWith(
      KITCHEN_TICKETS_QUERY_KEY,
      expect.any(Function),
    );
    const updater = mocks.setQueryData.mock.calls[0]![1];
    expect(updater([])).toEqual([ticket]);
  });

  it("removes served tickets from the visible queue", () => {
    useKitchenRealtime();
    const updaterCall = () => {
      mocks.handlers[1]![1]({
        type: "kitchen.ticket.updated",
        payload: {
          id: "t1",
          status: "SERVED",
          firedAt: "2026-08-27T10:00:00.000Z",
        },
      });
      return mocks.setQueryData.mock.calls.at(-1)![1];
    };
    expect(updaterCall()([{ id: "t1", status: "READY" }])).toEqual([]);
  });
});
