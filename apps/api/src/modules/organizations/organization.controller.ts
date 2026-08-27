import type { AuthContext } from "../../core/auth";
import {
  createdResponse,
  successResponse,
} from "../../core/response/response-helpers";
import { organizationService } from "./organization.service";

export const organizationController = {
  async list(auth: AuthContext) {
    return successResponse(await organizationService.list(auth));
  },
  async create(auth: AuthContext, input: { name: string }) {
    return createdResponse(await organizationService.create(auth, input));
  },
  async update(
    auth: AuthContext,
    organizationId: string,
    changes: { name?: string },
  ) {
    return successResponse(
      await organizationService.update(auth, organizationId, changes),
    );
  },
  async archive(auth: AuthContext, organizationId: string) {
    return successResponse(
      await organizationService.archive(auth, organizationId),
    );
  },
};
