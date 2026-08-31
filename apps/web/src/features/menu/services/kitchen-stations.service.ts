import { createMenuApi } from "@pos/api-client";
import { apiClient } from "@/shared/lib/api-client";

const menuApi = createMenuApi(apiClient);

export const kitchenStationsService = {
  list: menuApi.listKitchenStations,
  create: menuApi.createKitchenStation,
  remove: menuApi.removeKitchenStation,
  routes: menuApi.listStationRoutes,
  setRoute: menuApi.setStationRoute,
  removeRoute: menuApi.removeStationRoute,
};
