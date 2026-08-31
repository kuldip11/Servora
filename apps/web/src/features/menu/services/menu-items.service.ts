import { apiClient } from "../../../shared/lib/api-client";
import type { MenuItem, MenuCategory, MenuItemStatus } from "@pos/types";

export interface MenuItemFormPayload {
  categoryId: string;
  name: string;
  description?: string;
  basePrice: number;
  pricingMode?: "FIXED" | "WEIGHT_BASED" | "OPEN";
  weightUnit?: "G" | "KG" | "LB" | "OZ" | null;
  openPriceMin?: number | null;
  openPriceMax?: number | null;
  supportsZones?: boolean;
  zonePricingRule?: "AVERAGE" | "HIGHER" | "SUM_HALF";
  manualStockCount?: number | null;
  taxRate: number;
  taxMode?: "INCLUSIVE" | "EXCLUSIVE" | null;
  foodType: string;
  spiceLevel?: string;
  sku?: string;
  prepTimeMinutes?: number;
  hsnCode?: string;
  status: MenuItemStatus;
  availabilityReason: string | null;
  enableRecipeDeduction: boolean;
  displayMode?: "STANDARD" | "GUIDED_BUILDER";
  effectiveFrom?: string | null;
  variants: { name: string; price: number }[];
  modifierGroupIds: string[];
  tagIds: string[];
  allergenIds: string[];
  imageUrls: string[];
}

export const menuItemsService = {
  async listCategories(): Promise<MenuCategory[]> {
    const res = await apiClient.get("/menu/categories");
    return res.data.data;
  },

  async addCategory(name: string): Promise<MenuCategory> {
    const res = await apiClient.post("/menu/categories", { name });
    return res.data.data;
  },

  async renameCategory(id: string, name: string): Promise<MenuCategory> {
    const res = await apiClient.patch(`/menu/categories/${id}`, { name });
    return res.data.data;
  },

  async deleteCategory(id: string): Promise<void> {
    await apiClient.delete(`/menu/categories/${id}`);
  },

  async saveItem(
    item: MenuItem | null,
    payload: MenuItemFormPayload,
  ): Promise<MenuItem> {
    const res = item
      ? await apiClient.patch(`/menu/items/${item.id}`, payload)
      : await apiClient.post("/menu/items", payload);
    return res.data.data;
  },


  async setManualStockCount(
    id: string,
    count: number | null,
    variantId?: string,
  ): Promise<void> {
    await apiClient.post(`/menu/items/${id}/stock-count`, {
      count,
      ...(variantId ? { variantId } : {}),
    });
  },

  async setManualAvailabilityOverride(
    id: string,
    status: MenuItemStatus,
    reason: string,
  ): Promise<void> {
    await apiClient.put(`/menu/items/${id}/manual-override`, { status, reason });
  },

  async clearManualAvailabilityOverride(id: string): Promise<void> {
    await apiClient.delete(`/menu/items/${id}/manual-override`);
  },

  async deleteItem(id: string): Promise<void> {
    await apiClient.delete(`/menu/items/${id}`);
  },

  async duplicateItem(id: string): Promise<MenuItem> {
    const res = await apiClient.post(`/menu/items/${id}/duplicate`);
    return res.data.data;
  },

  async setPublished(id: string, publish: boolean): Promise<void> {
    await apiClient.patch(
      `/menu/items/${id}/${publish ? "publish" : "unpublish"}`,
    );
  },

  async bulkSetStatus(
    itemIds: string[],
    status: MenuItemStatus,
    reason?: string,
  ): Promise<{ updated: number }> {
    const res = await apiClient.post("/menu/items/bulk/status", {
      itemIds,
      status,
      reason,
    });
    return res.data.data;
  },

  async bulkMoveCategory(
    itemIds: string[],
    categoryId: string,
  ): Promise<{ updated: number }> {
    const res = await apiClient.post("/menu/items/bulk/category", {
      itemIds,
      categoryId,
    });
    return res.data.data;
  },

  async bulkUpdateTags(
    itemIds: string[],
    tagIds: string[],
    mode: "add" | "remove" | "replace",
  ): Promise<{ updated: number }> {
    const res = await apiClient.post("/menu/items/bulk/tags", {
      itemIds,
      tagIds,
      mode,
    });
    return res.data.data;
  },

  async bulkAdjustPrice(
    itemIds: string[],
    priceChange: number,
    mode: "set" | "increase" | "decrease",
  ): Promise<{ updated: number }> {
    const res = await apiClient.post("/menu/items/bulk/price", {
      itemIds,
      priceChange,
      mode,
    });
    return res.data.data;
  },

  async bulkDelete(
    itemIds: string[],
  ): Promise<{ deleted: number; protected: number }> {
    const res = await apiClient.post("/menu/items/bulk/delete", { itemIds });
    return res.data.data;
  },
};
