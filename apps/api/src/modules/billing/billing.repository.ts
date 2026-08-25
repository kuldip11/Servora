import { and, eq } from 'drizzle-orm';
import type { PaymentMethod } from '@pos/types';
import { db } from '../../db';
import { bills, payments, paymentRefunds, orders } from '../../db/schema';
import { resolveRefundEligibility } from './billing-refund';

export type RecordPaymentResult =
  | { status: 'order_not_found' }
  | { status: 'ok'; orderBranchId: string; bill: typeof bills.$inferSelect; payment: typeof payments.$inferSelect };

export type RecordRefundResult =
  | { status: 'payment_not_found' }
  | { status: 'not_refundable'; orderBranchId: string }
  | { status: 'exceeds_amount'; orderBranchId: string }
  | { status: 'ok'; orderBranchId: string; refund: typeof paymentRefunds.$inferSelect };

export const billingRepository = {
  async recordPayment(data: {
    orderId: string;
    method: PaymentMethod;
    amount: number;
    reference?: string | undefined;
    tenantId: string;
    branchId: string | null;
  }): Promise<RecordPaymentResult> {
    return db.transaction(async (tx) => {
      const order = await tx.query.orders.findFirst({
        where: and(eq(orders.id, data.orderId), eq(orders.tenantId, data.tenantId)),
      });
      if (!order || (data.branchId && order.branchId !== data.branchId)) return { status: 'order_not_found' };

      let bill = await tx.query.bills.findFirst({ where: eq(bills.orderId, data.orderId) });
      if (!bill) {
        const [newBill] = await tx.insert(bills).values({
          orderId: data.orderId,
          subtotal: order.subtotal,
          taxAmount: order.taxAmount,
          discountAmount: order.discountAmount,
          totalAmount: order.totalAmount,
        }).returning();
        bill = newBill!;
      }

      const [payment] = await tx.insert(payments).values({
        orderId: data.orderId,
        billId: bill.id,
        method: data.method,
        amount: data.amount.toFixed(2),
        reference: data.reference ?? null,
        status: 'SUCCESS',
      }).returning();

      return { status: 'ok', orderBranchId: order.branchId, bill, payment: payment! };
    });
  },

  async recordRefund(data: {
    paymentId: string;
    amount: number;
    reason: string;
    processedBy: string;
    tenantId: string;
    branchId: string | null;
  }): Promise<RecordRefundResult> {
    return db.transaction(async (tx) => {
      const [row] = await tx.select({ payment: payments, orderBranchId: orders.branchId })
        .from(payments)
        .innerJoin(orders, eq(orders.id, payments.orderId))
        .where(data.branchId
          ? and(eq(payments.id, data.paymentId), eq(orders.tenantId, data.tenantId), eq(orders.branchId, data.branchId))
          : and(eq(payments.id, data.paymentId), eq(orders.tenantId, data.tenantId)));
      if (!row) return { status: 'payment_not_found' };

      const resolution = resolveRefundEligibility(row.payment.status, parseFloat(row.payment.amount), data.amount);
      if (!resolution.ok) {
        return { status: resolution.reason === 'PAYMENT_NOT_REFUNDABLE' ? 'not_refundable' : 'exceeds_amount', orderBranchId: row.orderBranchId };
      }

      const [updatedPayment] = await tx
        .update(payments)
        .set({ status: 'REFUNDED' })
        .where(and(eq(payments.id, data.paymentId), eq(payments.status, 'SUCCESS')))
        .returning();
      if (!updatedPayment) return { status: 'not_refundable', orderBranchId: row.orderBranchId };

      const [refund] = await tx.insert(paymentRefunds).values({
        paymentId: data.paymentId,
        amount: data.amount.toFixed(2),
        reason: data.reason,
        processedBy: data.processedBy,
      }).returning();
      return { status: 'ok', orderBranchId: row.orderBranchId, refund: refund! };
    });
  },

  async findBillById(data: { billId: string; tenantId: string; branchId: string | null }) {
    const [row] = await db.select({ bill: bills, orderBranchId: orders.branchId })
      .from(bills)
      .innerJoin(orders, eq(orders.id, bills.orderId))
      .where(data.branchId
        ? and(eq(bills.id, data.billId), eq(orders.tenantId, data.tenantId), eq(orders.branchId, data.branchId))
        : and(eq(bills.id, data.billId), eq(orders.tenantId, data.tenantId)));
    if (!row) return undefined;
    const bill = await db.query.bills.findFirst({ where: eq(bills.id, data.billId), with: { payments: true } });
    return bill ? { bill, orderBranchId: row.orderBranchId } : undefined;
  },
};
