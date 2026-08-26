import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "../../../../shared/lib/api-client";
import { createOrder } from "../createOrder";

vi.mock("../../../../shared/lib/api-client", () => ({
  apiClient: { post: vi.fn() },
}));

describe("createOrder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates input and returns created order data", async () => {
    const input = {
      type: "TAKEAWAY" as const,
      items: [
        { menuItemId: "550e8400-e29b-41d4-a716-446655440000", quantity: 1 },
      ],
    };
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { data: { id: "o1" } },
    } as any);
    await expect(createOrder(input)).resolves.toEqual({ id: "o1" });
    expect(apiClient.post).toHaveBeenCalledWith("/orders", input);
  });

  it("rejects invalid order input before the network call", async () => {
    await expect(
      createOrder({ type: "TAKEAWAY", items: [] }),
    ).rejects.toThrow();
    expect(apiClient.post).not.toHaveBeenCalled();
  });
});
