import { apiClient } from "../../../shared/lib/api-client";
import type { MenuTemplate } from "@pos/types";

export interface ApplyTemplateInput {
  branchId?: string;
  categoryName?: string;
}

export interface SaveTemplateInput {
  name: string;
  description?: string;
}

export const menuTemplatesService = {
  async list(): Promise<MenuTemplate[]> {
    const res = await apiClient.get("/menu/templates");
    return res.data.data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/menu/templates/${id}`);
  },

  async apply(templateId: string, input: ApplyTemplateInput): Promise<void> {
    await apiClient.post(`/menu/templates/${templateId}/apply`, {
      branchId: input.branchId || undefined,
      categoryName: input.categoryName || undefined,
    });
  },

  async saveFromCategory(
    categoryId: string,
    input: SaveTemplateInput,
  ): Promise<MenuTemplate> {
    const res = await apiClient.post(
      `/menu/templates/from-category/${categoryId}`,
      {
        name: input.name,
        description: input.description || undefined,
      },
    );
    return res.data.data;
  },
};
