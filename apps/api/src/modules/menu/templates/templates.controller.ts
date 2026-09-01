import type { AuthContext } from "@/core/auth";
import { successResponse, createdResponse } from "@/core/response";
import { templatesService } from "./templates.service";

export const templatesController = {
  async list(auth: AuthContext) {
    const templates = await templatesService.list(auth);
    return successResponse(templates);
  },

  async get(auth: AuthContext, templateId: string) {
    const template = await templatesService.get(auth, templateId);
    return successResponse(template);
  },

  async createFromCategory(
    auth: AuthContext,
    categoryId: string,
    name: string,
    description: string | undefined,
  ) {
    const template = await templatesService.createFromCategory(
      auth,
      categoryId,
      name,
      description,
    );
    return createdResponse(template);
  },

  async apply(
    auth: AuthContext,
    templateId: string,
    options: { branchId?: string; categoryName?: string },
  ) {
    const result = await templatesService.apply(auth, templateId, options);
    return createdResponse(result);
  },

  async delete(auth: AuthContext, templateId: string) {
    await templatesService.delete(auth, templateId);
    return successResponse(null);
  },
};
