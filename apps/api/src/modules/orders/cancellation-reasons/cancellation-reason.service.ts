import type { AuthContext } from "../../../core/auth";
import { requirePermission } from "../../../core/auth";
import { NotFoundError, ValidationError } from "../../../core/errors";
import { cancellationReasonRepository } from "./cancellation-reason.repository";

export const cancellationReasonService = {
  async list(auth: AuthContext, activeOnly = false) {
    requirePermission(auth, "orders:read");
    await cancellationReasonRepository.ensureDefaults(auth.tenantId);
    return cancellationReasonRepository.list(auth.tenantId, activeOnly);
  },
  async create(auth: AuthContext, label: string) {
    requirePermission(auth, "settings:update");
    const normalized = label.trim();
    if (!normalized) throw new ValidationError("Cancellation reason label is required");
    return cancellationReasonRepository.create(auth.tenantId, normalized);
  },
  async update(auth: AuthContext, id: string, patch: { label?: string; isActive?: boolean }) {
    requirePermission(auth, "settings:update");
    const existing = await cancellationReasonRepository.findById(auth.tenantId, id);
    if (!existing) throw new NotFoundError("Cancellation reason", id);
    const normalized = patch.label?.trim();
    if (patch.label !== undefined && !normalized) {
      throw new ValidationError("Cancellation reason label is required");
    }
    return cancellationReasonRepository.update(auth.tenantId, id, {
      ...(normalized !== undefined ? { label: normalized } : {}),
      ...(patch.isActive !== undefined ? { isActive: patch.isActive } : {}),
    });
  },
  async assertUsable(tenantId: string, id?: string) {
    if (!id) return;
    const [reason] = await cancellationReasonRepository.findActiveByIds(tenantId, [id]);
    if (!reason) throw new ValidationError("Cancellation reason is invalid or inactive");
  },
};
