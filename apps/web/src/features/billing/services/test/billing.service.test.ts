import { describe, expect, it, vi } from "vitest";
const api = vi.hoisted(() => ({ post: vi.fn(), patch: vi.fn() }));
vi.mock("../../../../shared/lib/api-client", () => ({ apiClient: api }));
import { billingService } from "../billing.service";

describe("billingService", () => {
  it("records payment and marks order paid", async () => {
    api.post.mockResolvedValue({});
    api.patch.mockResolvedValue({});
    await billingService.collectPayment("o1", { method: "CARD", amount: 50 });
    expect(api.post).toHaveBeenCalledWith("/payments", {
      orderId: "o1",
      method: "CARD",
      amount: 50,
      reference: undefined,
    });
    expect(api.patch).toHaveBeenCalledWith("/orders/o1/status", {
      status: "PAID",
    });
  });
  it("passes a reference when supplied", async () => {
    api.post.mockResolvedValue({});
    api.patch.mockResolvedValue({});
    await billingService.collectPayment("o1", {
      method: "CASH",
      amount: 20,
      reference: "R-1",
    });
    expect(api.post).toHaveBeenCalledWith("/payments", {
      orderId: "o1",
      method: "CASH",
      amount: 20,
      reference: "R-1",
    });
  });
});
