import { createMenuApi } from "@pos/api-client";
import { apiClient } from "../../../shared/lib/api-client";

const menuApi = createMenuApi(apiClient);

export interface ApplyTemplateInput {
  branchId?: string;
  categoryName?: string;
}
export interface SaveTemplateInput {
  name: string;
  description?: string;
}

export const menuTemplatesService = {
  list: menuApi.listTemplates,
  remove: menuApi.removeTemplate,
  async apply(templateId: string, input: ApplyTemplateInput): Promise<void> {
    await menuApi.applyTemplate(templateId, {
      ...(input.branchId !== undefined && { branchId: input.branchId }),
      ...(input.categoryName !== undefined && { categoryName: input.categoryName }),
    });
  },
  async saveFromCategory(categoryId: string, input: SaveTemplateInput) {
    return menuApi.saveTemplateFromCategory(categoryId, {
      name: input.name,
      ...(input.description !== undefined && { description: input.description }),
    });
  },
};
