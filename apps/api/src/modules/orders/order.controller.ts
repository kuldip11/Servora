/**
 * Order controller — thin handlers only. Auth/branch resolution comes
 * from `requireAuthPlugin` (applied in `order.route.ts`); business logic
 * lives in `order.service.ts`.
 */
import type { OrderStatus } from '@pos/types';
import type { AuthContext } from '../../core/auth';
import { successResponse, createdResponse } from '../../core/response';
import { orderService, type CreateOrderInput, type FireTicketInput } from './order.service';

export const orderController = {
  async list(auth: AuthContext, filters: { status?: string | undefined; type?: string | undefined }) {
    const orders = await orderService.list(auth, filters);
    return successResponse(orders);
  },

  async getById(auth: AuthContext, orderId: string) {
    const order = await orderService.getById(auth, orderId);
    return successResponse(order);
  },

  async getInventoryImpact(auth: AuthContext, orderId: string) {
    const impact = await orderService.getInventoryImpact(auth, orderId);
    return successResponse(impact);
  },

  async create(auth: AuthContext, input: CreateOrderInput) {
    const order = await orderService.create(auth, input);
    return createdResponse(order);
  },

  async updateStatus(
    auth: AuthContext,
    orderId: string,
    status: OrderStatus,
    reason: string | undefined,
  ) {
    const order = await orderService.updateStatus(auth, orderId, status, reason);
    return successResponse(order);
  },

  async fireTicket(auth: AuthContext, orderId: string, input: FireTicketInput) {
    const order = await orderService.fireTicket(auth, orderId, input);
    return successResponse(order);
  },
};
