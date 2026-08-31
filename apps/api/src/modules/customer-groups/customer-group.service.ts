import type { AuthContext } from "../../core/auth";
import { requirePermission } from "../../core/auth";
import { NotFoundError, ValidationError } from "../../core/errors";
import { writeAudit } from "../../core/audit";
import { customerGroupRepository } from "./customer-group.repository";

export interface CustomerGroupInput { name: string; discountPercent?: number | null; discountFixed?: number | null }
function validate(input: CustomerGroupInput) {
  if (!input.name.trim()) throw new ValidationError("Customer-group name is required");
  if (input.discountPercent != null && input.discountFixed != null) throw new ValidationError("Configure at most one default customer-group discount");
  if (input.discountPercent != null && (input.discountPercent <= 0 || input.discountPercent > 100)) throw new ValidationError("discountPercent must be greater than 0 and at most 100");
  if (input.discountFixed != null && input.discountFixed < 0) throw new ValidationError("discountFixed cannot be negative");
}
export const customerGroupService = {
  async list(auth: AuthContext) { requirePermission(auth, "menu:read"); return customerGroupRepository.list(auth.tenantId); },
  async findById(auth: AuthContext, id: string) { requirePermission(auth, "menu:read"); const row = await customerGroupRepository.findById(auth.tenantId, id); if (!row) throw new NotFoundError("Customer group not found"); return row; },
  async create(auth: AuthContext, input: CustomerGroupInput) { requirePermission(auth, "menu:pricing:write"); validate(input); const row = await customerGroupRepository.create({ tenantId: auth.tenantId, name: input.name.trim(), ...(input.discountPercent !== undefined ? { discountPercent: input.discountPercent } : {}), ...(input.discountFixed !== undefined ? { discountFixed: input.discountFixed } : {}) }); await writeAudit({ tenantId: auth.tenantId, branchId: auth.branchId, userId: auth.userId, requestId: auth.requestId, ipAddress: auth.ipAddress, action: "CUSTOMER_GROUP_CREATED", entity: "customer_group", entityId: row.id, metadata: { name: row.name } }); return row; },
  async update(auth: AuthContext, id: string, patch: Partial<CustomerGroupInput>) { requirePermission(auth, "menu:pricing:write"); const existing = await customerGroupRepository.findById(auth.tenantId, id); if (!existing) throw new NotFoundError("Customer group not found"); const merged: CustomerGroupInput = { name: patch.name ?? existing.name, discountPercent: patch.discountPercent === undefined ? (existing.discountPercent == null ? null : Number(existing.discountPercent)) : patch.discountPercent, discountFixed: patch.discountFixed === undefined ? (existing.discountFixed == null ? null : Number(existing.discountFixed)) : patch.discountFixed }; validate(merged); const row = await customerGroupRepository.update(auth.tenantId, id, patch); if (!row) throw new NotFoundError("Customer group not found"); await writeAudit({ tenantId: auth.tenantId, branchId: auth.branchId, userId: auth.userId, requestId: auth.requestId, ipAddress: auth.ipAddress, action: "CUSTOMER_GROUP_UPDATED", entity: "customer_group", entityId: id }); return row; },
  async remove(auth: AuthContext, id: string) { requirePermission(auth, "menu:pricing:write"); const row = await customerGroupRepository.remove(auth.tenantId, id); if (!row) return; await writeAudit({ tenantId: auth.tenantId, branchId: auth.branchId, userId: auth.userId, requestId: auth.requestId, ipAddress: auth.ipAddress, action: "CUSTOMER_GROUP_DELETED", entity: "customer_group", entityId: id }); },
};
