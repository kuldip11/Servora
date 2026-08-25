/**
 * Table controller — thin handlers only. Auth/branch resolution comes
 * from `requireAuthPlugin` (applied in `table.route.ts`); business rules
 * live in `table.service.ts`.
 */
import type { AuthContext } from "../../core/auth";
import { successResponse, createdResponse } from "../../core/response";
import {
  tableService,
  type CreateTableInput,
  type UpdateTableInput,
} from "./table.service";
import type { TableStatus } from "@pos/types";

export const tableController = {
  async list(auth: AuthContext) {
    const tables = await tableService.list(auth);
    return successResponse(tables);
  },

  async create(auth: AuthContext, input: CreateTableInput) {
    const table = await tableService.create(auth, input);
    return createdResponse(table);
  },

  async update(auth: AuthContext, tableId: string, changes: UpdateTableInput) {
    const updated = await tableService.update(auth, tableId, changes);
    return successResponse(updated);
  },

  async updateStatus(auth: AuthContext, tableId: string, status: TableStatus) {
    const updated = await tableService.updateStatus(auth, tableId, status);
    return successResponse(updated);
  },

  async remove(auth: AuthContext, tableId: string) {
    await tableService.remove(auth, tableId);
    return successResponse(null);
  },
};
