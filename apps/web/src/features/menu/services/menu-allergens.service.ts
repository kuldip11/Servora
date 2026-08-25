import { apiClient } from "../../../shared/lib/api-client";
import type { MenuAllergen } from "@pos/types";

export const menuAllergensService = {
  async list(): Promise<MenuAllergen[]> {
    const res = await apiClient.get("/menu/allergens");
    return res.data.data;
  },
};
