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
};
