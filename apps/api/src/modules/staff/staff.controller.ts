

import type { AuthContext } from "../../core/auth";
import { successResponse, createdResponse } from "../../core/response";
import {
  staffService,
  type CreateStaffInput,
  type UpdateStaffInput,
} from "./staff.service";

export const staffController = {
  async list(auth: AuthContext) {
    const staffList = await staffService.list(auth);
    return successResponse(staffList);
  },

  async create(auth: AuthContext, input: CreateStaffInput) {
    const staffMember = await staffService.create(auth, input);
    return createdResponse(staffMember);
  },

  async update(auth: AuthContext, id: string, input: UpdateStaffInput) {
    const updated = await staffService.update(auth, id, input);
    return successResponse(updated);
  },

  async remove(auth: AuthContext, id: string) {
    await staffService.remove(auth, id);
    return successResponse(null);
  },

  async listRoles(auth: AuthContext) {
    const allRoles = await staffService.listRoles(auth);
    return successResponse(allRoles);
  },
};
