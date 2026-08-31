import { createTablesApi } from "@pos/api-client";
import { apiClient } from "../../../shared/lib/api-client";

export const tablesService = createTablesApi(apiClient);
