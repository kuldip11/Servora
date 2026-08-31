import { createMenuApi } from "@pos/api-client";
import { apiClient } from "../../../shared/lib/api-client";

const menuApi = createMenuApi(apiClient);
import type { MenuAllergen } from "@pos/types";

export const menuAllergensService = {
  async list(): Promise<MenuAllergen[]> {
    return menuApi.listAllergens<MenuAllergen>();
  },
};
