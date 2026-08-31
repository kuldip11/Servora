import type { Menu } from "@pos/types";
import { apiClient } from "../../../shared/lib/api-client";

export const menusService = {
  async list(): Promise<Menu[]> {
    const response = await apiClient.get("/menu/menus");
    return response.data.data;
  },
  async create(input: { name: string; description?: string }): Promise<Menu> {
    const response = await apiClient.post("/menu/menus", input);
    return response.data.data;
  },
  async update(
    id: string,
    input: Pick<Menu, "availableChannels" | "availableFulfillmentTypes" | "availableBranchIds"> & { effectiveFrom?: string | null },
  ): Promise<Menu> {
    const response = await apiClient.patch(`/menu/menus/${id}`, input);
    return response.data.data;
  },
  async publish(id: string): Promise<Menu> {
    const response = await apiClient.post(`/menu/menus/${id}/publish`);
    return response.data.data;
  },
  async unpublish(id: string): Promise<Menu> {
    const response = await apiClient.post(`/menu/menus/${id}/unpublish`);
    return response.data.data;
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/menu/menus/${id}`);
  },
  async assignItem(
    itemId: string,
    input: { menuId: string; categoryId: string; sortOrder?: number },
  ): Promise<void> {
    await apiClient.post(`/menu/items/${itemId}/memberships`, input);
  },
  async removeItem(itemId: string, menuId: string): Promise<void> {
    await apiClient.delete(`/menu/items/${itemId}/memberships/${menuId}`);
  },
};
