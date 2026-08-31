import { createMenuApi } from "@pos/api-client";
import type { OrderableMenuCategory } from "@pos/types";
import { apiClient } from "../../../shared/lib/api-client";

const menuApi = createMenuApi(apiClient);
export type WaiterMenuCategory = OrderableMenuCategory;
export const fetchCategories = menuApi.listOrderableCategories;
