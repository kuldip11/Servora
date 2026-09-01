import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  useQuery: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({ useQuery: mocks.useQuery }));

import {
  useKitchenTickets,
  KITCHEN_TICKETS_QUERY_KEY,
} from "@/features/kitchen/hooks/useKitchenTickets";
import { TICKETS_POLL_INTERVAL_MS } from "@/features/kitchen/constants";

describe("useKitchenTickets", () => {
  it("configures ticket query", () => {
    mocks.useQuery.mockReturnValue({});
    expect(useKitchenTickets()).toEqual({});
    const options = mocks.useQuery.mock.calls[0][0];
    expect(options.queryKey).toEqual(KITCHEN_TICKETS_QUERY_KEY);
    expect(options.refetchInterval).toBe(TICKETS_POLL_INTERVAL_MS);
  });
});
