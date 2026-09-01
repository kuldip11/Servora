import type { AuthContext } from "@/core/auth";
import { successResponse } from "@/core/response";
import { permissionService } from "./permission.service";

export const permissionController = {
  async list(auth: AuthContext) {
    return successResponse(await permissionService.list(auth));
  },
  async forRole(auth: AuthContext, id: string) {
    return successResponse(await permissionService.forRole(auth, id));
  },
  async setForRole(auth: AuthContext, id: string, permissionIds: string[]) {
    return successResponse(
      await permissionService.setForRole(auth, id, permissionIds),
    );
  },
};
