import { describe, expect, it, vi } from "vitest";

const { createPayment } = vi.hoisted(() => ({ createPayment: vi.fn() }));
const { createRefund } = vi.hoisted(() => ({ createRefund: vi.fn() }));
const { getBill } = vi.hoisted(() => ({ getBill: vi.fn() }));
vi.mock("../billing.service", () => ({
  billingService: { createPayment, createRefund, getBill },
}));

import { billingController } from "@/modules/billing/billing.controller";

const auth = {
  userId: "u1",
  tenantId: "t1",
  branchId: "b1",
  email: "u@example.com",
  roles: [],
  permissions: [],
} as any;

describe("billing controller", () => {
  it("delegates payment creation and wraps it as a created response", async () => {
    createPayment.mockResolvedValue({
      payment: { id: "p1" },
      bill: { id: "b1" },
    });
    await expect(
      billingController.createPayment(auth, {
        orderId: "o1",
        method: "CARD",
        amount: 10,
      }),
    ).resolves.toEqual({
      success: true,
      data: { payment: { id: "p1" }, bill: { id: "b1" } },
    });
    expect(createPayment).toHaveBeenCalledWith(auth, {
      orderId: "o1",
      method: "CARD",
      amount: 10,
    });
  });
  it("delegates refunds and bill reads with the correct response envelope", async () => {
    createRefund.mockResolvedValue({ id: "r1" });
    getBill.mockResolvedValue({ id: "b1" });
    await expect(
      billingController.createRefund(auth, {
        paymentId: "p1",
        amount: 5,
        reason: "return",
      }),
    ).resolves.toEqual({ success: true, data: { id: "r1" } });
    await expect(billingController.getBill(auth, "b1")).resolves.toEqual({
      success: true,
      data: { id: "b1" },
    });
  });
});
