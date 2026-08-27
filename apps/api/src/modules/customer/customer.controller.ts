import { createdResponse, successResponse } from "../../core/response";
import { customerService, type CreateCustomerOrderInput, type CustomerCheckoutInput } from "./customer.service";

export const customerController = {
  async createSession(qrToken: string) {
    return createdResponse(await customerService.createSession(qrToken));
  },
  async getMenu(sessionToken: string) {
    return successResponse(await customerService.getMenu(sessionToken));
  },
  async createOrder(sessionToken: string, input: CreateCustomerOrderInput) {
    return createdResponse(await customerService.createOrder(sessionToken, input));
  },
  async verifyTakeawayPayment(sessionToken: string, input: Parameters<typeof customerService.verifyTakeawayPayment>[1]) {
    return createdResponse(await customerService.verifyTakeawayPayment(sessionToken, input));
  },
  async checkout(sessionToken: string, input: CustomerCheckoutInput) {
    return createdResponse(await customerService.checkout(sessionToken, input));
  },
  async getOrder(sessionToken: string, orderId: string) {
    return successResponse(await customerService.getOrder(sessionToken, orderId));
  },
};
