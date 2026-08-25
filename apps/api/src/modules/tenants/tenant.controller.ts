import type { AuthContext } from '../../core/auth';
import { createdResponse, successResponse } from '../../core/response/response-helpers';
import { tenantService } from './tenant.service';

export const tenantController = {
  async list(auth: AuthContext) {
    return successResponse(await tenantService.list(auth));
  },
  async create(auth: AuthContext, input: { name: string }) {
    return createdResponse(await tenantService.create(auth, input));
  },
  async update(auth: AuthContext, tenantId: string, changes: { name?: string }) {
    return successResponse(await tenantService.update(auth, tenantId, changes));
  },
  async archive(auth: AuthContext, tenantId: string) {
    return successResponse(await tenantService.archive(auth, tenantId));
  },
};
