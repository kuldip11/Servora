import { apiClient } from "../../../shared/lib/api-client";
import type { MenuItemBranchOverride, MenuItemStatus } from "@pos/types";

export interface BranchOverrideFormInput {
  price: string; // '' = no override, matches how the API stores/reads null
  taxRate: string;
  prepTimeMinutes: string;
  status: MenuItemStatus | "";
  isHidden: boolean;
  availabilityReason: string;
}

export const menuBranchOverridesService = {
  async list(itemId: string): Promise<MenuItemBranchOverride[]> {
    const res = await apiClient.get(`/menu/items/${itemId}/branches`);
    return res.data.data;
  },

  async save(
    itemId: string,
    branchId: string,
    input: BranchOverrideFormInput,
  ): Promise<void> {
    await apiClient.put(`/menu/items/${itemId}/branch/${branchId}`, {
      price: input.price.trim() ? parseFloat(input.price) : null,
      taxRate: input.taxRate.trim() ? parseFloat(input.taxRate) : null,
      prepTimeMinutes: input.prepTimeMinutes.trim()
        ? parseInt(input.prepTimeMinutes, 10)
        : null,
      status: input.status || null,
      isHidden: input.isHidden,
      availabilityReason: input.availabilityReason.trim() || null,
    });
  },

  async reset(itemId: string, branchId: string): Promise<void> {
    await apiClient.delete(`/menu/items/${itemId}/branch/${branchId}`);
  },
};
