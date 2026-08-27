/**
 * Branch controller — thin handlers only. Auth/branch resolution comes
 * from `requireAuthPlugin` (applied in `branch.route.ts`); business rules
 * live in `branch.service.ts`.
 */
import type { AuthContext } from "../../core/auth";
import { successResponse, createdResponse } from "../../core/response";
import {
  branchService,
  type CreateBranchInput,
  type UpdateBranchInput,
} from "./branch.service";

export const branchController = {
  async list(auth: AuthContext) {
    const branches = await branchService.list(auth);
    return successResponse(branches);
  },

  async create(auth: AuthContext, input: CreateBranchInput) {
    const branch = await branchService.create(auth, input);
    return createdResponse(branch);
  },

  async update(
    auth: AuthContext,
    branchId: string,
    changes: UpdateBranchInput,
  ) {
    const updated = await branchService.update(auth, branchId, changes);
    return successResponse(updated);
  },

  async getTakeawayQr(auth: AuthContext, branchId: string) {
    return successResponse(await branchService.getTakeawayQr(auth, branchId));
  },

  async regenerateTakeawayQr(auth: AuthContext, branchId: string) {
    return successResponse(
      await branchService.regenerateTakeawayQr(auth, branchId),
    );
  },

  async deactivate(auth: AuthContext, branchId: string) {
    await branchService.deactivate(auth, branchId);
    return successResponse(null);
  },
};
