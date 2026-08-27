import type { PaymentMethod, RestaurantTable } from "@pos/types";
import type { AuthContext } from "../../core/auth";
import { writeAudit } from "../../core/audit";
import { billingRepository } from "./billing.repository";
import { eventBus } from "../../lib/event-bus";
import { orderRepository } from "../orders/order.repository";
import {
  orderNotFound,
  paymentNotFound,
  billNotFound,
  paymentNotRefundable,
  refundExceedsPaymentAmount,
  paymentExceedsDueAmount,
} from "./billing.errors";
import {
  assertBillingResourceAccess,
  requireBillingPermission,
} from "./billing-authorization";

export interface CreatePaymentInput {
  orderId: string;
  method: PaymentMethod;
  amount: number;
  reference?: string | undefined;
}

export interface CreateRefundInput {
  paymentId: string;
  amount: number;
  reason: string;
}

export const billingService = {
  async createPayment(auth: AuthContext, input: CreatePaymentInput) {
    requireBillingPermission(auth, "billing:create");
    const result = await billingRepository.recordPayment({
      ...input,
      tenantId: auth.tenantId,
      branchId: auth.branchId,
      changedBy: auth.userId,
    });
    if (result.status === "order_not_found") throw orderNotFound(input.orderId);
    if (result.status === "payment_exceeds_due")
      throw paymentExceedsDueAmount();
    assertBillingResourceAccess(auth, result.orderBranchId);

    await writeAudit({
      tenantId: auth.tenantId,
      userId: auth.userId,
      branchId: auth.branchId,
      requestId: auth.requestId,
      ipAddress: auth.ipAddress,
      action: "PAYMENT_CREATED",
      entity: "payment",
      entityId: result.payment.id,
      metadata: {
        orderId: input.orderId,
        amount: input.amount,
        method: input.method,
        status: result.payment.status,
        branchId: result.orderBranchId,
      },
    });

    await eventBus.publish(
      {
        type: "payment.updated",
        payload: {
          paymentId: result.payment.id,
          orderId: input.orderId,
          status: result.payment.status,
          amount: parseFloat(result.payment.amount),
        },
      },
      auth.tenantId,
      result.orderBranchId,
    );

    if (result.orderPaid && result.order.status === "PAID") {
      const paidOrder = await orderRepository.findById(
        auth.tenantId,
        input.orderId,
      );
      if (paidOrder) {
        await eventBus.publish(
          { type: "order.updated", payload: paidOrder as never },
          auth.tenantId,
          result.orderBranchId,
        );
      }
      if (result.releasedTable) {
        await eventBus.publish(
          {
            type: "table.updated",
            payload: result.releasedTable as unknown as RestaurantTable,
          },
          auth.tenantId,
          result.orderBranchId,
        );
      }
    }

    return {
      bill: result.bill,
      payment: result.payment,
      paymentState: result.orderPaid ? "PAID" : "PARTIALLY_PAID",
    };
  },

  async createRefund(auth: AuthContext, input: CreateRefundInput) {
    requireBillingPermission(auth, "billing:refund");
    const result = await billingRepository.recordRefund({
      ...input,
      processedBy: auth.userId,
      tenantId: auth.tenantId,
      branchId: auth.branchId,
    });
    if (result.status === "payment_not_found")
      throw paymentNotFound(input.paymentId);
    assertBillingResourceAccess(auth, result.orderBranchId);
    if (result.status === "not_refundable") throw paymentNotRefundable();
    if (result.status === "exceeds_amount") throw refundExceedsPaymentAmount();
    await writeAudit({
      tenantId: auth.tenantId,
      userId: auth.userId,
      branchId: auth.branchId,
      requestId: auth.requestId,
      ipAddress: auth.ipAddress,
      action: "REFUND_CREATED",
      entity: "payment_refund",
      entityId: result.refund.id,
      metadata: {
        paymentId: input.paymentId,
        amount: input.amount,
        reason: input.reason,
        branchId: result.orderBranchId,
      },
    });
    return result.refund;
  },

  async getBill(auth: AuthContext, billId: string) {
    requireBillingPermission(auth, "billing:read");
    const result = await billingRepository.findBillById({
      billId,
      tenantId: auth.tenantId,
      branchId: auth.branchId,
    });
    if (!result) throw billNotFound(billId);
    assertBillingResourceAccess(auth, result.orderBranchId);
    return result.bill;
  },
};
