import { describe, expect, it, vi } from "vitest";
import { apiClient } from "../../../../shared/lib/api-client";
import {
  addOrderItems,
  fetchOrder,
  fetchOrders,
  updateOrderStatus,
  updateTicketStatus,
} from "../orders";

vi.mock("../../../../shared/lib/api-client", () => ({
  apiClient: { get: vi.fn(), patch: vi.fn(), post: vi.fn() },
}));

describe("orders API", () => {
  it("fetches list and detail endpoints", async () => {
    vi.mocked(apiClient.get)
      .mockResolvedValueOnce({ data: { data: [{ id: "o1" }] } } as any)
      .mockResolvedValueOnce({ data: { data: { id: "o1" } } } as any);
    await expect(fetchOrders()).resolves.toEqual([{ id: "o1" }]);
    await expect(fetchOrder("o1")).resolves.toEqual({ id: "o1" });
    expect(apiClient.get).toHaveBeenNthCalledWith(1, "/orders");
    expect(apiClient.get).toHaveBeenNthCalledWith(2, "/orders/o1");
  });

  it("validates mutation payloads before calling the API", async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({} as any);
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { data: { id: "o1" } },
    } as any);
    await updateOrderStatus("o1", "PAID");
    expect(apiClient.patch).toHaveBeenCalledWith("/orders/o1/status", {
      status: "PAID",
    });
    await updateTicketStatus("t1", "READY");
    expect(apiClient.patch).toHaveBeenCalledWith("/kitchen-tickets/t1/status", {
      status: "READY",
    });
    await addOrderItems(
      "o1",
      [{ menuItemId: "550e8400-e29b-41d4-a716-446655440000", quantity: 2 }],
      [],
      "no onions",
    );
    expect(apiClient.post).toHaveBeenCalledWith("/orders/o1/items", {
      items: [
        { menuItemId: "550e8400-e29b-41d4-a716-446655440000", quantity: 2 },
      ],
      notes: "no onions",
    });
    await expect(updateOrderStatus("o1", "INVALID")).rejects.toThrow();
  });
});
