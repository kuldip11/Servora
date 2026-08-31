import { and, eq, inArray, isNull, or, sum } from "drizzle-orm";
import type { PaymentMethod } from "@pos/types";
import { db } from "../../db";
import {
  bills,
  payments,
  paymentRefunds,
  orders,
  orderStatusHistory,
  restaurantTables,
  billOrderItems,
  orderItems,
  orderItemSeatShares,
} from "../../db/schema";
import { resolveRefundEligibility } from "./billing-refund";
import { allocateTotalsByWeight, areAllBillsPaid, combinedOrderAmounts, groupOrderItemsForEvenBills, splitMoneyEvenly, validateComboGroupAllocations, validateItemAllocations, validateFractionalComboAllocations, validateItemShareAllocations, type ItemAllocation, type ItemShareAllocation } from "./billing-split";

export type RecordPaymentResult =
  | { status: "order_not_found" }
  | { status: "bill_not_found" }
  | { status: "bill_required" }
  | { status: "payment_exceeds_due"; dueAmount: number }
  | {
      status: "ok";
      orderBranchId: string;
      bill: typeof bills.$inferSelect;
      payment: typeof payments.$inferSelect;
      order: typeof orders.$inferSelect;
      orderPaid: boolean;
      releasedTables?: Array<typeof restaurantTables.$inferSelect>;
    };

export type RecordRefundResult =
  | { status: "payment_not_found" }
  | { status: "not_refundable"; orderBranchId: string }
  | { status: "exceeds_amount"; orderBranchId: string }
  | {
      status: "ok";
      orderBranchId: string;
      refund: typeof paymentRefunds.$inferSelect;
    };

export const billingRepository = {
  async recordPayment(data: {
    orderId: string;
    billId?: string | undefined;
    method: PaymentMethod;
    amount: number;
    reference?: string | undefined;
    tenantId: string;
    branchId: string | null;
    changedBy: string;
  }): Promise<RecordPaymentResult> {
    return db.transaction(async (tx) => {
      const order = await tx.query.orders.findFirst({
        where: and(
          eq(orders.id, data.orderId),
          eq(orders.tenantId, data.tenantId),
        ),
      });
      if (!order || (data.branchId && order.branchId !== data.branchId))
        return { status: "order_not_found" };
      const billingOrder = order.mergedIntoOrderId
        ? await tx.query.orders.findFirst({ where: and(eq(orders.id, order.mergedIntoOrderId), eq(orders.tenantId, data.tenantId)) })
        : order;
      if (!billingOrder) return { status: "order_not_found" };
      const billingOrderId = billingOrder.id;
      const mergedOrders = await tx.query.orders.findMany({ where: eq(orders.mergedIntoOrderId, billingOrderId) });
      const combinedOrders = [billingOrder, ...mergedOrders];
      const combinedOrderIds = combinedOrders.map((candidate) => candidate.id);

      const orderBills = await tx.query.bills.findMany({
        where: eq(bills.orderId, billingOrderId),
      });
      let bill = data.billId
        ? orderBills.find((candidate) => candidate.id === data.billId)
        : orderBills.length === 1
          ? orderBills[0]
          : undefined;
      if (data.billId && !bill) return { status: "bill_not_found" };
      if (!data.billId && orderBills.length > 1) return { status: "bill_required" };
      if (!bill) {
        const combined = combinedOrderAmounts(combinedOrders);
        const [newBill] = await tx
          .insert(bills)
          .values({
            orderId: billingOrderId,
            ...combined,
          })
          .returning();
        bill = newBill!;
        const activeItems = await tx.query.orderItems.findMany({
          where: and(inArray(orderItems.orderId, combinedOrderIds), eq(orderItems.billingExcluded, false), or(eq(orderItems.itemStatus, "ACTIVE"), and(eq(orderItems.itemStatus, "REFIRED"), isNull(orderItems.compedAt)))),
        });
        if (activeItems.length) {
          await tx.insert(billOrderItems).values(
            activeItems.map((item) => ({ billId: bill!.id, orderItemId: item.id })),
          );
        }
      }

      const existingSuccessfulPayments = await tx
        .select({ total: sum(payments.amount) })
        .from(payments)
        .where(
          and(
            eq(payments.billId, bill.id),
            eq(payments.status, "SUCCESS"),
          ),
        );
      const alreadyPaid = parseFloat(
        existingSuccessfulPayments[0]?.total ?? "0",
      );
      const dueAmount = Math.max(0, parseFloat(bill.totalAmount) - alreadyPaid);
      if (data.amount > dueAmount + 0.01) {
        return { status: "payment_exceeds_due", dueAmount };
      }

      const [payment] = await tx
        .insert(payments)
        .values({
          orderId: billingOrderId,
          billId: bill.id,
          method: data.method,
          amount: data.amount.toFixed(2),
          reference: data.reference ?? null,
          status: "SUCCESS",
        })
        .returning();

      const allBills = orderBills.length ? orderBills : [bill];
      const paymentTotals = await tx
        .select({ billId: payments.billId, total: sum(payments.amount) })
        .from(payments)
        .where(and(eq(payments.orderId, billingOrderId), eq(payments.status, "SUCCESS")))
        .groupBy(payments.billId);
      const totals = new Map<string, number>(
        paymentTotals
          .filter((row): row is typeof row & { billId: string } => row.billId !== null)
          .map((row) => [row.billId, parseFloat(row.total ?? "0")]),
      );
      const orderPaid = areAllBillsPaid(allBills, totals);

      let updatedOrder = order;
      const releasedTables: Array<typeof restaurantTables.$inferSelect> = [];
      if (orderPaid && billingOrder.status === "BILL_REQUESTED") {
        const paidOrders = await tx
          .update(orders)
          .set({ status: "PAID", updatedAt: new Date() })
          .where(
            and(
              inArray(orders.id, combinedOrderIds),
              eq(orders.tenantId, data.tenantId),
            ),
          )
          .returning();
        const paid = paidOrders.find((candidate) => candidate.id === billingOrderId);
        if (paid) {
          updatedOrder = paid;
          await tx.insert(orderStatusHistory).values(
            combinedOrders.filter((candidate) => candidate.status === "BILL_REQUESTED").map((candidate) => ({
              orderId: candidate.id, oldStatus: "BILL_REQUESTED" as const, newStatus: "PAID" as const,
              changedBy: data.changedBy, reason: "Combined payment completed",
            })),
          );
          for (const paidOrder of paidOrders) if (paidOrder.tableId) {
            const [table] = await tx
              .update(restaurantTables)
              .set({ status: "AVAILABLE", updatedAt: new Date() })
              .where(
                and(
                  eq(restaurantTables.id, paidOrder.tableId),
                  eq(restaurantTables.tenantId, data.tenantId),
                  eq(restaurantTables.branchId, paidOrder.branchId),
                ),
              )
              .returning();
            if (table) releasedTables.push(table);
          }
        }
      }

      return {
        status: "ok",
        orderBranchId: billingOrder.branchId,
        bill,
        payment: payment!,
        order: updatedOrder,
        orderPaid,
        ...(releasedTables.length ? { releasedTables } : {}),
      };
    });
  },

  async splitOrderEvenly(data: { orderId: string; ways: number; tenantId: string; branchId: string | null }) {
    return db.transaction(async (tx) => {
      const order = await tx.query.orders.findFirst({
        where: and(eq(orders.id, data.orderId), eq(orders.tenantId, data.tenantId)),
      });
      if (!order || (data.branchId && order.branchId !== data.branchId)) return { status: "order_not_found" as const };
      const existingPayments = await tx.query.payments.findFirst({ where: eq(payments.orderId, data.orderId) });
      if (existingPayments) return { status: "already_paid" as const, orderBranchId: order.branchId };
      const activeItems = await tx.query.orderItems.findMany({
        where: and(eq(orderItems.orderId, data.orderId), eq(orderItems.billingExcluded, false), or(eq(orderItems.itemStatus, "ACTIVE"), and(eq(orderItems.itemStatus, "REFIRED"), isNull(orderItems.compedAt)))),
      });
      const itemIdsByBill = groupOrderItemsForEvenBills(activeItems, data.ways);
      if (!itemIdsByBill) return { status: "too_many_bills" as const, orderBranchId: order.branchId };
      const oldBills = await tx.query.bills.findMany({ where: eq(bills.orderId, data.orderId) });
      if (oldBills.length) {
        await tx.delete(billOrderItems).where(inArray(billOrderItems.billId, oldBills.map((bill) => bill.id)));
        await tx.delete(bills).where(inArray(bills.id, oldBills.map((bill) => bill.id)));
      }
      const totals = splitMoneyEvenly(parseFloat(order.totalAmount), data.ways);
      const subtotals = splitMoneyEvenly(parseFloat(order.subtotal), data.ways);
      const taxes = splitMoneyEvenly(parseFloat(order.taxAmount), data.ways);
      const discounts = splitMoneyEvenly(parseFloat(order.discountAmount), data.ways);
      const serviceCharges = splitMoneyEvenly(parseFloat(order.serviceChargeAmount), data.ways);
      const roundingAdjustments = splitMoneyEvenly(parseFloat(order.roundingAdjustment), data.ways);
      const created = await tx.insert(bills).values(totals.map((total, index) => ({
        orderId: data.orderId,
        splitLabel: `Bill ${index + 1}`,
        subtotal: subtotals[index]!.toFixed(2),
        taxAmount: taxes[index]!.toFixed(2),
        discountAmount: discounts[index]!.toFixed(2),
        serviceChargeAmount: serviceCharges[index]!.toFixed(2),
        roundingAdjustment: roundingAdjustments[index]!.toFixed(2),
        totalAmount: total.toFixed(2),
      }))).returning();
      await tx.insert(billOrderItems).values(itemIdsByBill.flatMap((itemIds, billIndex) =>
        itemIds.map((orderItemId) => ({
          billId: created[billIndex]!.id,
          orderItemId,
        })),
      ));
      return { status: "ok" as const, orderBranchId: order.branchId, bills: created };
    });
  },

  async splitOrderByItems(data: { orderId: string; allocations: ItemAllocation[]; tenantId: string; branchId: string | null }) {
    return db.transaction(async (tx) => {
      const order = await tx.query.orders.findFirst({ where: and(eq(orders.id, data.orderId), eq(orders.tenantId, data.tenantId)) });
      if (!order || (data.branchId && order.branchId !== data.branchId)) return { status: "order_not_found" as const };
      const existingPayment = await tx.query.payments.findFirst({ where: eq(payments.orderId, data.orderId) });
      if (existingPayment) return { status: "already_paid" as const, orderBranchId: order.branchId };
      const activeItems = await tx.query.orderItems.findMany({ where: and(eq(orderItems.orderId, data.orderId), eq(orderItems.billingExcluded, false), or(eq(orderItems.itemStatus, "ACTIVE"), and(eq(orderItems.itemStatus, "REFIRED"), isNull(orderItems.compedAt)))) });
      const validation = validateItemAllocations(activeItems.map((item) => item.id), data.allocations);
      if (!validation.ok) return { status: "invalid_allocation" as const, reason: validation.reason, orderBranchId: order.branchId };
      const comboValidation = validateComboGroupAllocations(activeItems, data.allocations);
      if (!comboValidation.ok) return { status: "invalid_allocation" as const, reason: comboValidation.reason, orderBranchId: order.branchId };
      const itemsById = new Map(activeItems.map((item) => [item.id, item]));
      const weights = data.allocations.map((allocation) => allocation.orderItemIds.reduce((sum, id) => {
        const item = itemsById.get(id)!;
        return sum + Number(item.subtotal) * (item.taxMode === "INCLUSIVE" ? 1 : (1 + Number(item.taxRate) / 100));
      }, 0));
      const totals = allocateTotalsByWeight(Number(order.totalAmount), weights);
      const subtotals = data.allocations.map((allocation) => allocation.orderItemIds.reduce((sum, id) => sum + Number(itemsById.get(id)!.subtotal), 0));
      const taxes = allocateTotalsByWeight(Number(order.taxAmount), weights);
      const discounts = allocateTotalsByWeight(Number(order.discountAmount), weights);
      const serviceCharges = allocateTotalsByWeight(Number(order.serviceChargeAmount), weights);
      const roundingAdjustments = allocateTotalsByWeight(Number(order.roundingAdjustment), weights);
      const oldBills = await tx.query.bills.findMany({ where: eq(bills.orderId, data.orderId) });
      if (oldBills.length) {
        await tx.delete(billOrderItems).where(inArray(billOrderItems.billId, oldBills.map((bill) => bill.id)));
        await tx.delete(bills).where(inArray(bills.id, oldBills.map((bill) => bill.id)));
      }
      const created = await tx.insert(bills).values(data.allocations.map((allocation, index) => ({
        orderId: data.orderId,
        splitLabel: allocation.label?.trim() || `Bill ${index + 1}`,
        subtotal: subtotals[index]!.toFixed(2),
        taxAmount: taxes[index]!.toFixed(2),
        discountAmount: discounts[index]!.toFixed(2),
        serviceChargeAmount: serviceCharges[index]!.toFixed(2),
        roundingAdjustment: roundingAdjustments[index]!.toFixed(2),
        totalAmount: totals[index]!.toFixed(2),
      }))).returning();
      await tx.insert(billOrderItems).values(data.allocations.flatMap((allocation, index) => allocation.orderItemIds.map((orderItemId) => ({ billId: created[index]!.id, orderItemId }))));
      return { status: "ok" as const, orderBranchId: order.branchId, bills: created };
    });
  },

  async replaceSeatShares(data: {
    orderId: string; orderItemId: string; tenantId: string; branchId: string | null;
    shares: Array<{ seatLabel: string; shareRatio: number }>;
  }) {
    return db.transaction(async (tx) => {
      const order = await tx.query.orders.findFirst({
        where: and(eq(orders.id, data.orderId), eq(orders.tenantId, data.tenantId)),
      });
      if (!order || (data.branchId && order.branchId !== data.branchId)) return { status: "order_not_found" as const };
      const item = await tx.query.orderItems.findFirst({
        where: and(eq(orderItems.id, data.orderItemId), eq(orderItems.orderId, data.orderId), eq(orderItems.billingExcluded, false)),
      });
      if (!item) return { status: "item_not_found" as const, orderBranchId: order.branchId };
      const payment = await tx.query.payments.findFirst({ where: eq(payments.orderId, data.orderId) });
      if (payment) return { status: "already_paid" as const, orderBranchId: order.branchId };
      await tx.delete(orderItemSeatShares).where(eq(orderItemSeatShares.orderItemId, data.orderItemId));
      if (data.shares.length) {
        await tx.insert(orderItemSeatShares).values(data.shares.map((share) => ({
          orderItemId: data.orderItemId, seatLabel: share.seatLabel.trim(), shareRatio: share.shareRatio.toFixed(6),
        })));
      }
      return { status: "ok" as const, orderBranchId: order.branchId };
    });
  },

  async splitOrderByShares(data: { orderId: string; allocations: ItemShareAllocation[]; tenantId: string; branchId: string | null }) {
    return db.transaction(async (tx) => {
      const order = await tx.query.orders.findFirst({ where: and(eq(orders.id, data.orderId), eq(orders.tenantId, data.tenantId)) });
      if (!order || (data.branchId && order.branchId !== data.branchId)) return { status: "order_not_found" as const };
      const existingPayment = await tx.query.payments.findFirst({ where: eq(payments.orderId, data.orderId) });
      if (existingPayment) return { status: "already_paid" as const, orderBranchId: order.branchId };
      const activeItems = await tx.query.orderItems.findMany({
        where: and(eq(orderItems.orderId, data.orderId), eq(orderItems.billingExcluded, false), or(eq(orderItems.itemStatus, "ACTIVE"), and(eq(orderItems.itemStatus, "REFIRED"), isNull(orderItems.compedAt)))),
      });
      const validation = validateItemShareAllocations(activeItems.map((item) => item.id), data.allocations);
      if (!validation.ok) return { status: "invalid_allocation" as const, reason: validation.reason, orderBranchId: order.branchId };
      const comboValidation = validateFractionalComboAllocations(activeItems, data.allocations);
      if (!comboValidation.ok) return { status: "invalid_allocation" as const, reason: comboValidation.reason, orderBranchId: order.branchId };
      const itemsById = new Map(activeItems.map((item) => [item.id, item]));
      const weights = data.allocations.map((allocation) => allocation.itemShares.reduce((sum, share) => {
        const item = itemsById.get(share.orderItemId)!;
        const gross = Number(item.subtotal) * (item.taxMode === "INCLUSIVE" ? 1 : 1 + Number(item.taxRate) / 100);
        return sum + gross * share.shareRatio;
      }, 0));
      const totals = allocateTotalsByWeight(Number(order.totalAmount), weights);
      const subtotals = allocateTotalsByWeight(Number(order.subtotal), weights);
      const taxes = allocateTotalsByWeight(Number(order.taxAmount), weights);
      const discounts = allocateTotalsByWeight(Number(order.discountAmount), weights);
      const serviceCharges = allocateTotalsByWeight(Number(order.serviceChargeAmount), weights);
      const roundingAdjustments = allocateTotalsByWeight(Number(order.roundingAdjustment), weights);
      const oldBills = await tx.query.bills.findMany({ where: eq(bills.orderId, data.orderId) });
      if (oldBills.length) {
        await tx.delete(billOrderItems).where(inArray(billOrderItems.billId, oldBills.map((bill) => bill.id)));
        await tx.delete(bills).where(inArray(bills.id, oldBills.map((bill) => bill.id)));
      }
      const created = await tx.insert(bills).values(data.allocations.map((allocation, index) => ({
        orderId: data.orderId, splitLabel: allocation.label?.trim() || `Bill ${index + 1}`,
        subtotal: subtotals[index]!.toFixed(2), taxAmount: taxes[index]!.toFixed(2), discountAmount: discounts[index]!.toFixed(2),
        serviceChargeAmount: serviceCharges[index]!.toFixed(2), roundingAdjustment: roundingAdjustments[index]!.toFixed(2), totalAmount: totals[index]!.toFixed(2),
      }))).returning();
      await tx.insert(billOrderItems).values(data.allocations.flatMap((allocation, index) => allocation.itemShares.map((share) => ({
        billId: created[index]!.id, orderItemId: share.orderItemId, allocationRatio: share.shareRatio.toFixed(6),
      }))));
      return { status: "ok" as const, orderBranchId: order.branchId, bills: created };
    });
  },

  async findBillsByOrder(data: { orderId: string; tenantId: string; branchId: string | null }) {
    const order = await db.query.orders.findFirst({ where: and(eq(orders.id, data.orderId), eq(orders.tenantId, data.tenantId)) });
    if (!order || (data.branchId && order.branchId !== data.branchId)) return undefined;
    const orderBills = await db.query.bills.findMany({
      where: eq(bills.orderId, data.orderId),
      with: {
        payments: true,
        itemAssignments: { with: { orderItem: { with: { order: { with: { table: true } } } } } },
      },
    });
    return { bills: orderBills, orderBranchId: order.branchId };
  },

  async findActiveItemsForSeatSplit(data: { orderId: string; tenantId: string; branchId: string | null }) {
    const order = await db.query.orders.findFirst({ where: and(eq(orders.id, data.orderId), eq(orders.tenantId, data.tenantId)) });
    if (!order || (data.branchId && order.branchId !== data.branchId)) return undefined;
    const items = await db.query.orderItems.findMany({
      where: and(eq(orderItems.orderId, data.orderId), eq(orderItems.billingExcluded, false), or(eq(orderItems.itemStatus, "ACTIVE"), and(eq(orderItems.itemStatus, "REFIRED"), isNull(orderItems.compedAt)))),
      with: { seatShares: true },
    });
    return { orderBranchId: order.branchId, items };
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
      const [row] = await tx
        .select({ payment: payments, orderBranchId: orders.branchId })
        .from(payments)
        .innerJoin(orders, eq(orders.id, payments.orderId))
        .where(
          data.branchId
            ? and(
                eq(payments.id, data.paymentId),
                eq(orders.tenantId, data.tenantId),
                eq(orders.branchId, data.branchId),
              )
            : and(
                eq(payments.id, data.paymentId),
                eq(orders.tenantId, data.tenantId),
              ),
        );
      if (!row) return { status: "payment_not_found" };

      const resolution = resolveRefundEligibility(
        row.payment.status,
        parseFloat(row.payment.amount),
        data.amount,
      );
      if (!resolution.ok) {
        return {
          status:
            resolution.reason === "PAYMENT_NOT_REFUNDABLE"
              ? "not_refundable"
              : "exceeds_amount",
          orderBranchId: row.orderBranchId,
        };
      }

      const [updatedPayment] = await tx
        .update(payments)
        .set({ status: "REFUNDED" })
        .where(
          and(eq(payments.id, data.paymentId), eq(payments.status, "SUCCESS")),
        )
        .returning();
      if (!updatedPayment)
        return { status: "not_refundable", orderBranchId: row.orderBranchId };

      const [refund] = await tx
        .insert(paymentRefunds)
        .values({
          paymentId: data.paymentId,
          amount: data.amount.toFixed(2),
          reason: data.reason,
          processedBy: data.processedBy,
        })
        .returning();
      return {
        status: "ok",
        orderBranchId: row.orderBranchId,
        refund: refund!,
      };
    });
  },

  async findBillById(data: {
    billId: string;
    tenantId: string;
    branchId: string | null;
  }) {
    const [row] = await db
      .select({ bill: bills, orderBranchId: orders.branchId })
      .from(bills)
      .innerJoin(orders, eq(orders.id, bills.orderId))
      .where(
        data.branchId
          ? and(
              eq(bills.id, data.billId),
              eq(orders.tenantId, data.tenantId),
              eq(orders.branchId, data.branchId),
            )
          : and(eq(bills.id, data.billId), eq(orders.tenantId, data.tenantId)),
      );
    if (!row) return undefined;
    const bill = await db.query.bills.findFirst({
      where: eq(bills.id, data.billId),
      with: { payments: true },
    });
    return bill ? { bill, orderBranchId: row.orderBranchId } : undefined;
  },
};
