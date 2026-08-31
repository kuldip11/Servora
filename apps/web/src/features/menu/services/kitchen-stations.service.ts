import type { ItemStationRoute, KitchenStation } from "@pos/types";
import { apiClient } from "../../../shared/lib/api-client";

export const kitchenStationsService = {
  async list(): Promise<KitchenStation[]> {
    return (await apiClient.get("/kitchen/stations")).data.data;
  },
  async create(input: { name: string; printerIdentifier?: string; sortOrder?: number }): Promise<KitchenStation> {
    return (await apiClient.post("/kitchen/stations", input)).data.data;
  },
  async remove(id: string): Promise<void> { await apiClient.delete(`/kitchen/stations/${id}`); },
  async routes(itemId: string): Promise<ItemStationRoute[]> {
    return (await apiClient.get(`/kitchen/stations/routes/${itemId}`)).data.data;
  },
  async setRoute(itemId: string, stationId: string, modifierOptionId?: string | null): Promise<ItemStationRoute> {
    return (await apiClient.put(`/kitchen/stations/routes/${itemId}`, { stationId, modifierOptionId: modifierOptionId ?? null })).data.data;
  },
  async removeRoute(itemId: string, modifierOptionId?: string | null): Promise<void> {
    await apiClient.delete(`/kitchen/stations/routes/${itemId}`, { params: modifierOptionId ? { modifierOptionId } : {} });
  },
};
