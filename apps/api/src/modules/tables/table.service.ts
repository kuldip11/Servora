/**
 * Table service — business rules that used to live inline in the
 * controller: branch resolution/validation on create, and blocking
 * status/delete changes while a table has an active order.
 */
import type { TableStatus } from '@pos/types';
import type { AuthContext } from '../../core/auth';
import { tableRepository } from './table.repository';
import { branchRepository } from '../branches/branch.repository';
import {
  tableNotFound,
  branchNotFound,
  branchRequiredForTable,
  tablesDisabledForBranch,
  tableHasActiveOrder,
  tableHasOpenOrder,
} from './table.errors';
import {
  assertTableListScope,
  assertTableResourceAccess,
  requireTablesPermission,
  resolveTableBranch,
} from './tables-authorization';

export interface CreateTableInput {
  name: string;
  capacity?: number | undefined;
  section?: string | undefined;
  branchId?: string | undefined;
}

export interface UpdateTableInput {
  name?: string | undefined;
  capacity?: number | undefined;
  section?: string | undefined;
  status?: TableStatus | undefined;
}

export const tableService = {
  // Branch-locked staff see only their own branch; OWNER/MANAGER can pass
  // `null` (resolved from "all branches") to see everything, tagged by branch.
  async list(auth: AuthContext) {
    requireTablesPermission(auth, 'tables:read');
    assertTableListScope(auth);
    return tableRepository.findMany(auth.tenantId, auth.branchId);
  },

  async create(auth: AuthContext, input: CreateTableInput) {
    requireTablesPermission(auth, 'tables:create');
    let branchId: string;
    try {
      branchId = resolveTableBranch(auth, input.branchId);
    } catch (error) {
      if (!input.branchId && !auth.branchId) throw branchRequiredForTable();
      throw error;
    }
    if (!branchId) throw branchRequiredForTable();

    // Enforcement point for "tables disabled" (e.g. a delivery-only cloud
    // kitchen) — the UI hiding the Tables page is just a convenience on
    // top of this.
    const branch = await branchRepository.findById(auth.tenantId, branchId);
    if (!branch) throw branchNotFound(branchId);
    if (!branch.tablesEnabled) throw tablesDisabledForBranch();

    return tableRepository.create({
      tenantId: auth.tenantId,
      branchId,
      name: input.name,
      capacity: input.capacity,
      section: input.section,
    });
  },

  async update(auth: AuthContext, tableId: string, changes: UpdateTableInput) {
    requireTablesPermission(auth, 'tables:update');
    const table = await tableRepository.findById(auth.tenantId, tableId);
    if (!table) throw tableNotFound(tableId);
    assertTableResourceAccess(auth, table.branchId);

    if (changes.status !== undefined) {
      await assertNoActiveOrder(auth.tenantId, tableId);
    }

    const updated = await tableRepository.update(auth.tenantId, tableId, changes);
    if (!updated) throw tableNotFound(tableId);
    return updated;
  },

  // Dedicated status endpoint — the one the waiter/kitchen apps hit
  // frequently to flip a table between AVAILABLE / OCCUPIED / CLEANING /
  // RESERVED. Blocked while the table has an active order; status then
  // only changes automatically as a side effect of the order lifecycle
  // (see modules/orders/order.service.ts).
  async updateStatus(auth: AuthContext, tableId: string, status: TableStatus) {
    requireTablesPermission(auth, 'tables:update');
    const table = await tableRepository.findById(auth.tenantId, tableId);
    if (!table) throw tableNotFound(tableId);
    assertTableResourceAccess(auth, table.branchId);

    await assertNoActiveOrder(auth.tenantId, tableId);

    const updated = await tableRepository.update(auth.tenantId, tableId, { status });
    if (!updated) throw tableNotFound(tableId);
    return updated;
  },

  async remove(auth: AuthContext, tableId: string) {
    requireTablesPermission(auth, 'tables:delete');
    const table = await tableRepository.findById(auth.tenantId, tableId);
    if (!table) throw tableNotFound(tableId);
    assertTableResourceAccess(auth, table.branchId);

    const hasOpenOrders = await tableRepository.hasOpenOrders(auth.tenantId, tableId);
    if (hasOpenOrders) throw tableHasOpenOrder();

    const deleted = await tableRepository.softDelete(auth.tenantId, tableId);
    if (!deleted) throw tableNotFound(tableId);
    return deleted;
  },
};

async function assertNoActiveOrder(tenantId: string, tableId: string): Promise<void> {
  const hasOpenOrders = await tableRepository.hasOpenOrders(tenantId, tableId);
  if (hasOpenOrders) throw tableHasActiveOrder();
}
