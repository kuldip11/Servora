import { act, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AvailabilityDashboardPage } from "@/features/availability/pages/AvailabilityDashboardPage";

const { api, realtime } = vi.hoisted(() => ({
  api: { get: vi.fn() },
  realtime: { handler: undefined as (() => void) | undefined },
}));
vi.mock("../../../../shared/lib/api-client", () => ({
  apiClient: { get: api.get },
  extractApiError: (error: unknown) =>
    error instanceof Error ? error.message : "Request failed",
}));
vi.mock("../../../../shared/lib/realtime", () => ({
  useRealtimeEvent: vi.fn((_type: string, handler: () => void) => {
    realtime.handler = handler;
  }),
}));

describe("AvailabilityDashboardPage", () => {
  it("loads cross-context resolver output and refreshes on availability realtime events", async () => {
    api.get
      .mockResolvedValueOnce({
        data: {
          data: {
            rows: [
              {
                entityType: "ITEM",
                entityId: "item-1",
                menuItemId: "item-1",
                name: "Dal",
                status: "OUT_OF_STOCK",
                reason: "Insufficient inventory",
                cause: "RECIPE_DRIVEN",
                branchId: "b1",
                branchName: "Main",
                channel: "CUSTOMER_QR",
                fulfillmentType: "DELIVERY",
              },
            ],
          },
        },
      })
      .mockResolvedValueOnce({ data: { data: { rows: [] } } });

    render(<AvailabilityDashboardPage />);

    expect(await screen.findByText("Dal")).toBeTruthy();
    expect(screen.getByText("CUSTOMER_QR · DELIVERY")).toBeTruthy();
    expect(api.get).toHaveBeenCalledWith(
      "/menu/availability/dashboard",
      expect.objectContaining({
        params: expect.objectContaining({
          channel: "UNSCOPED",
          fulfillmentType: "UNSCOPED",
        }),
      }),
    );

    await act(async () => {
      realtime.handler?.();
    });
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));
    expect(
      await screen.findByText(
        "Everything in the selected scope is currently available.",
      ),
    ).toBeTruthy();
  });
});
