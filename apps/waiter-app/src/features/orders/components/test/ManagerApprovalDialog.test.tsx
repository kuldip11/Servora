import { describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock("../../../../shared/lib/api-client", () => ({
  apiClient: { post: api.post },
}));

import { requestManagerApproval } from "@/features/orders/components/ManagerApprovalDialog";

describe("waiter manager approval", () => {
  it("issues a scoped approval token for the blocked line adjustment", async () => {
    api.post.mockResolvedValueOnce({ data: { data: { token: "approval-1" } } });

    const token = await requestManagerApproval({
      orderId: "11111111-1111-4111-8111-111111111111",
      request: {
        action: "comp",
        itemId: "22222222-2222-4222-8222-222222222222",
        reason: { reason: "service recovery" },
      },
      managerEmail: "  manager@example.com  ",
      password: "secret",
    });

    expect(api.post).toHaveBeenCalledWith("/approvals/manager", {
      actionType: "COMP",
      orderId: "11111111-1111-4111-8111-111111111111",
      orderItemId: "22222222-2222-4222-8222-222222222222",
      managerEmail: "manager@example.com",
      password: "secret",
    });
    expect(token).toBe("approval-1");
  });
});
