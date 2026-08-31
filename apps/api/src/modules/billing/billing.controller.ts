/**
 * Billing controller — thin handlers only. Business rules live in
 * `billing.service.ts`; typed errors thrown here are caught by the global
 * `onError` handler in `src/index.ts` (no local try/catch needed, unlike
 * the pre-refactor routes).
 */
import { successResponse, createdResponse } from "../../core/response";
import {
  billingService,
  type CreatePaymentInput,
  type CreateRefundInput,
} from "./billing.service";

export const billingController = {
  async createPayment(
    auth: Parameters<typeof billingService.createPayment>[0],
    input: CreatePaymentInput,
  ) {
    const result = await billingService.createPayment(auth, input);
    return createdResponse(result);
  },

  async createRefund(
    auth: Parameters<typeof billingService.createRefund>[0],
    input: CreateRefundInput,
  ) {
    const refund = await billingService.createRefund(auth, input);
    return createdResponse(refund);
  },

  async getBill(
    auth: Parameters<typeof billingService.getBill>[0],
    billId: string,
  ) {
    const bill = await billingService.getBill(auth, billId);
    return successResponse(bill);
  },
  async splitOrder(auth: Parameters<typeof billingService.splitOrder>[0], orderId: string, ways: number) {
    return createdResponse(await billingService.splitOrder(auth, orderId, ways));
  },
  async splitOrderByItems(auth: Parameters<typeof billingService.splitOrderByItems>[0], orderId: string, allocations: Array<{ label?: string; orderItemIds: string[] }>) {
    return createdResponse(await billingService.splitOrderByItems(auth, orderId, allocations));
  },
  async splitOrderBySeat(auth: Parameters<typeof billingService.splitOrderBySeat>[0], orderId: string, sharedItemStrategy: "EVEN_SPLIT" | "MANUAL") {
    return createdResponse(await billingService.splitOrderBySeat(auth, orderId, sharedItemStrategy));
  },
  async setItemSeatShares(auth: Parameters<typeof billingService.setItemSeatShares>[0], orderId: string, orderItemId: string, shares: Array<{ seatLabel: string; shareRatio: number }>) {
    return successResponse(await billingService.setItemSeatShares(auth, orderId, orderItemId, shares));
  },
  async getOrderBills(auth: Parameters<typeof billingService.getOrderBills>[0], orderId: string) {
    return successResponse(await billingService.getOrderBills(auth, orderId));
  },
};
