import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  invalidateQueries: vi.fn(),
  useQueryClient: vi.fn(),
  useMutation: vi.fn((options: any) => options),
  toast: vi.fn(),
  updateTicketStatus: vi.fn(),
}));

mocks.useQueryClient.mockReturnValue({
  invalidateQueries: mocks.invalidateQueries,
});

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: mocks.useQueryClient,
  useMutation: mocks.useMutation,
}));
vi.mock("@pos/ui", () => ({ toast: mocks.toast }));
vi.mock("../../api/tickets", () => ({
  updateTicketStatus: mocks.updateTicketStatus,
}));

import { useUpdateTicketStatus } from "../useUpdateTicketStatus";
import { KITCHEN_TICKETS_QUERY_KEY } from "../useKitchenTickets";

describe("useUpdateTicketStatus", () => {
  it("configures mutation callbacks", async () => {
    const options = useUpdateTicketStatus() as any;
    await options.onSuccess();
    expect(mocks.invalidateQueries).toHaveBeenCalledWith({
      queryKey: KITCHEN_TICKETS_QUERY_KEY,
    });
    expect(mocks.toast).toHaveBeenCalledWith({
      title: "Ticket updated",
      tone: "success",
    });
    options.onError();
    expect(mocks.toast).toHaveBeenCalledWith({
      title: "Failed to update ticket",
      tone: "danger",
    });
  });
});
