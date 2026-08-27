import { beforeEach, describe, expect, it, vi } from "vitest";

const { recordPayment } = vi.hoisted(() => ({ recordPayment: vi.fn() }));
const { recordRefund } = vi.hoisted(() => ({ recordRefund: vi.fn() }));
const { findBillById } = vi.hoisted(() => ({ findBillById: vi.fn() }));
const { writeAudit } = vi.hoisted(() => ({ writeAudit: vi.fn() }));
vi.mock("../billing.repository", () => ({
  billingRepository: { recordPayment, recordRefund, findBillById },
}));
vi.mock("../../../core/audit", () => ({ writeAudit }));
vi.mock("../../../lib/event-bus", () => ({ eventBus: { publish: vi.fn() } }));
vi.mock("../../orders/order.repository", () => ({ orderRepository: { findById: vi.fn() } }));

import { billingService } from "../billing.service";

const baseAuth = {
  userId: "u1",
  tenantId: "t1",
  branchId: "b1",
  email: "u@example.com",
  roles: [],
  permissions: [],
} as any;

describe("billing service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("enforces payment permission and maps missing orders to 404", async () => {
    await expect(
      billingService.createPayment(baseAuth, {
        orderId: "o1",
        method: "CARD",
        amount: 10,
      }),
    ).rejects.toThrow(/Insufficient permissions|access denied/);
    const auth = { ...baseAuth, permissions: ["billing:create"] };
    recordPayment.mockResolvedValue({ status: "order_not_found" });
    await expect(
      billingService.createPayment(auth, {
        orderId: "o1",
        method: "CARD",
        amount: 10,
      }),
    ).rejects.toMatchObject({ details: { reason: "ORDER_NOT_FOUND" } });
  });

  it("creates payments and enforces resource branch access", async () => {
    const auth = { ...baseAuth, permissions: ["billing:create"] };
    const result = {
      bill: { id: "b1" },
      payment: { id: "p1", status: "SUCCESS", amount: "10" },
      order: { id: "o1", status: "BILL_REQUESTED" },
      orderPaid: false,
      orderBranchId: "b1",
    };
    recordPayment.mockResolvedValue({ status: "ok", ...result });
    await expect(
      billingService.createPayment(auth, {
        orderId: "o1",
        method: "CARD",
        amount: 10,
      }),
    ).resolves.toEqual({ bill: result.bill, payment: result.payment, paymentState: "PARTIALLY_PAID" });
    recordPayment.mockResolvedValue({
      status: "ok",
      ...result,
      orderBranchId: "b2",
    });
    await expect(
      billingService.createPayment(auth, {
        orderId: "o1",
        method: "CARD",
        amount: 10,
      }),
    ).rejects.toThrow(/Insufficient permissions|access denied/);
  });

  it("maps refund repository outcomes and audits successful refunds", async () => {
    const auth = { ...baseAuth, permissions: ["billing:refund"] };
    recordRefund.mockResolvedValue({ status: "payment_not_found" });
    await expect(
      billingService.createRefund(auth, {
        paymentId: "p1",
        amount: 5,
        reason: "return",
      }),
    ).rejects.toMatchObject({ details: { reason: "PAYMENT_NOT_FOUND" } });
    recordRefund.mockResolvedValue({
      status: "not_refundable",
      orderBranchId: "b1",
    });
    await expect(
      billingService.createRefund(auth, {
        paymentId: "p1",
        amount: 5,
        reason: "return",
      }),
    ).rejects.toMatchObject({ details: { reason: "PAYMENT_NOT_REFUNDABLE" } });
    recordRefund.mockResolvedValue({
      status: "exceeds_amount",
      orderBranchId: "b1",
    });
    await expect(
      billingService.createRefund(auth, {
        paymentId: "p1",
        amount: 5,
        reason: "return",
      }),
    ).rejects.toMatchObject({
      details: { reason: "REFUND_AMOUNT_EXCEEDS_PAYMENT" },
    });
    recordRefund.mockResolvedValue({
      status: "ok",
      orderBranchId: "b1",
      refund: { id: "r1" },
    });
    writeAudit.mockResolvedValue({ id: "a1" });
    await expect(
      billingService.createRefund(auth, {
        paymentId: "p1",
        amount: 5,
        reason: "return",
      }),
    ).resolves.toEqual({ id: "r1" });
    expect(writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "REFUND_CREATED",
        entityId: "r1",
        tenantId: "t1",
        userId: "u1",
      }),
    );
  });

  it("requires read permission and maps a missing bill to 404", async () => {
    await expect(billingService.getBill(baseAuth, "b1")).rejects.toThrow(
      /Insufficient permissions|access denied/,
    );
    const auth = { ...baseAuth, permissions: ["billing:read"] };
    findBillById.mockResolvedValue(undefined);
    await expect(billingService.getBill(auth, "b1")).rejects.toMatchObject({
      details: { reason: "BILL_NOT_FOUND" },
    });
    findBillById.mockResolvedValue({ bill: { id: "b1" }, orderBranchId: "b1" });
    await expect(billingService.getBill(auth, "b1")).resolves.toEqual({
      id: "b1",
    });
  });
});
