import { createMenuApi } from "@pos/api-client";
import type { MenuItemStatus } from "@pos/types";
import { apiClient } from "@/shared/lib/api-client";

const menuApi = createMenuApi(apiClient);

export interface BranchOverrideFormInput {
  price: string;
  taxRate: string;
  prepTimeMinutes: string;
  status: MenuItemStatus | "";
  isHidden: boolean;
  availabilityReason: string;
}

export const menuBranchOverridesService = {
  list: menuApi.listBranchOverrides,
  async save(
    itemId: string,
    branchId: string,
    input: BranchOverrideFormInput,
  ): Promise<void> {
    await menuApi.saveBranchOverride(itemId, branchId, {
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
  reset: menuApi.resetBranchOverride,
};
