import type { PaymentMethod } from '@pos/types';
import type { AuthContext } from '../../core/auth';
import { writeAudit } from '../../core/audit';
import { billingRepository } from './billing.repository';
import { orderNotFound, paymentNotFound, billNotFound, paymentNotRefundable, refundExceedsPaymentAmount } from './billing.errors';
import { assertBillingResourceAccess, requireBillingPermission } from './billing-authorization';

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
    requireBillingPermission(auth, 'billing:create');
    const result = await billingRepository.recordPayment({ ...input, tenantId: auth.tenantId, branchId: auth.branchId });
    if (result.status === 'order_not_found') throw orderNotFound(input.orderId);
    assertBillingResourceAccess(auth, result.orderBranchId);
    return { bill: result.bill, payment: result.payment };
  },

  async createRefund(auth: AuthContext, input: CreateRefundInput) {
    requireBillingPermission(auth, 'billing:refund');
    const result = await billingRepository.recordRefund({ ...input, processedBy: auth.userId, tenantId: auth.tenantId, branchId: auth.branchId });
    if (result.status === 'payment_not_found') throw paymentNotFound(input.paymentId);
    assertBillingResourceAccess(auth, result.orderBranchId);
    if (result.status === 'not_refundable') throw paymentNotRefundable();
    if (result.status === 'exceeds_amount') throw refundExceedsPaymentAmount();
    await writeAudit({ tenantId: auth.tenantId, userId: auth.userId, action: 'REFUND_CREATED', entity: 'payment_refund', entityId: result.refund.id, metadata: { paymentId: input.paymentId, amount: input.amount, reason: input.reason, branchId: result.orderBranchId } });
    return result.refund;
  },

  async getBill(auth: AuthContext, billId: string) {
    requireBillingPermission(auth, 'billing:read');
    const result = await billingRepository.findBillById({ billId, tenantId: auth.tenantId, branchId: auth.branchId });
    if (!result) throw billNotFound(billId);
    assertBillingResourceAccess(auth, result.orderBranchId);
    return result.bill;
  },
};
