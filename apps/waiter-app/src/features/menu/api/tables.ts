import { createTablesApi } from "@pos/api-client";
import { apiClient } from "../../../shared/lib/api-client";

const tablesApi = createTablesApi(apiClient);
export const fetchTables = tablesApi.list;
