import type { AuthContext } from "../../../core/auth";
import { createdResponse, successResponse } from "../../../core/response";
import {
  menuService,
  type CreateMenuInput,
  type UpdateMenuInput,
} from "./menu.service";

export const menuController = {
  async list(auth: AuthContext) {
    return successResponse(await menuService.list(auth));
  },
  async listActive(auth: AuthContext, channel: "STAFF" | "CUSTOMER_QR", fulfillmentType: "DINE_IN" | "TAKEAWAY" | "DELIVERY" | "ONLINE") {
    return successResponse(await menuService.listActive(auth, channel, fulfillmentType));
  },
  async getById(auth: AuthContext, id: string) {
    return successResponse(await menuService.getById(auth, id));
  },
  async create(auth: AuthContext, input: CreateMenuInput) {
    return createdResponse(await menuService.create(auth, input));
  },
  async update(auth: AuthContext, id: string, input: UpdateMenuInput) {
    return successResponse(await menuService.update(auth, id, input));
  },
  async publish(auth: AuthContext, id: string) {
    return successResponse(await menuService.publish(auth, id));
  },
  async unpublish(auth: AuthContext, id: string) {
    return successResponse(await menuService.unpublish(auth, id));
  },
  async remove(auth: AuthContext, id: string) {
    await menuService.remove(auth, id);
    return successResponse(null);
  },
  async listSchedules(auth: AuthContext, id: string) { return successResponse(await menuService.listSchedules(auth, id)); },
  async createSchedule(auth: AuthContext, id: string, input: any) { return createdResponse(await menuService.createSchedule(auth, id, input)); },
  async deleteSchedule(auth: AuthContext, id: string) { await menuService.deleteSchedule(auth, id); return successResponse(null); },
};
