import type { AuthContext } from "@/core/auth";
import {
  createdResponse,
  successResponse,
} from "@/core/response/response-helpers";
import { organizationService } from "./organization.service";

export const organizationController = {
  async listLoyaltyTiers(auth: AuthContext, organizationId: string) {
    return successResponse(
      await organizationService.listLoyaltyTiers(auth, organizationId),
    );
  },
  async createLoyaltyTier(
    auth: AuthContext,
    organizationId: string,
    input: Parameters<typeof organizationService.createLoyaltyTier>[2],
  ) {
    return createdResponse(
      await organizationService.createLoyaltyTier(auth, organizationId, input),
    );
  },
  async updateLoyaltyTier(
    auth: AuthContext,
    organizationId: string,
    tierId: string,
    input: Parameters<typeof organizationService.updateLoyaltyTier>[3],
  ) {
    return successResponse(
      await organizationService.updateLoyaltyTier(
        auth,
        organizationId,
        tierId,
        input,
      ),
    );
  },
  async deleteLoyaltyTier(
    auth: AuthContext,
    organizationId: string,
    tierId: string,
  ) {
    await organizationService.deleteLoyaltyTier(auth, organizationId, tierId);
    return successResponse(null);
  },
  async list(auth: AuthContext) {
    return successResponse(await organizationService.list(auth));
  },
  async create(
    auth: AuthContext,
    input: Parameters<typeof organizationService.create>[1],
  ) {
    return createdResponse(await organizationService.create(auth, input));
  },
  async update(
    auth: AuthContext,
    organizationId: string,
    changes: Parameters<typeof organizationService.update>[2],
  ) {
    return successResponse(
      await organizationService.update(auth, organizationId, changes),
    );
  },
  async listTenants(auth: AuthContext, organizationId: string) {
    return successResponse(
      await organizationService.listTenants(auth, organizationId),
    );
  },
  async listMenus(auth: AuthContext, organizationId: string) {
    return successResponse(
      await organizationService.listMenus(auth, organizationId),
    );
  },
  async createMenu(
    auth: AuthContext,
    organizationId: string,
    input: Parameters<typeof organizationService.createMenu>[2],
  ) {
    return createdResponse(
      await organizationService.createMenu(auth, organizationId, input),
    );
  },
  async updateMenu(
    auth: AuthContext,
    organizationId: string,
    menuId: string,
    input: Parameters<typeof organizationService.updateMenu>[3],
  ) {
    return successResponse(
      await organizationService.updateMenu(auth, organizationId, menuId, input),
    );
  },
  async deleteMenu(auth: AuthContext, organizationId: string, menuId: string) {
    await organizationService.deleteMenu(auth, organizationId, menuId);
    return successResponse(null);
  },
  async archive(auth: AuthContext, organizationId: string) {
    return successResponse(
      await organizationService.archive(auth, organizationId),
    );
  },
};
