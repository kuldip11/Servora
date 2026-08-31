import type { AuthContext } from "../../core/auth";
import { requirePermission } from "../../core/auth";
import { NotFoundError, ValidationError } from "../../core/errors";
import { writeAudit } from "../../core/audit";
import { loyaltyRepository } from "./loyalty.repository";

export interface LoyaltyTierInput {
  name: string;
  discountPercent?: number | null;
  discountFixed?: number | null;
}
export interface CustomerInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  loyaltyTierId?: string | null;
}

function normalizedTier(input: LoyaltyTierInput) {
  const hasPercent = input.discountPercent !== undefined && input.discountPercent !== null;
  const hasFixed = input.discountFixed !== undefined && input.discountFixed !== null;
  if (hasPercent === hasFixed) throw new ValidationError("Loyalty tier requires exactly one discount type");
  if (hasPercent && (input.discountPercent! <= 0 || input.discountPercent! > 100)) throw new ValidationError("Loyalty percentage must be greater than 0 and at most 100%");
  if (hasFixed && input.discountFixed! <= 0) throw new ValidationError("Loyalty fixed discount must be greater than 0");
  return {
    name: input.name.trim(),
    discountPercent: hasPercent ? input.discountPercent!.toFixed(2) : null,
    discountFixed: hasFixed ? input.discountFixed!.toFixed(2) : null,
  };
}

async function assertTierTenant(tenantId: string, tierId: string | null | undefined) {
  if (!tierId) return;
  if (!await loyaltyRepository.findApplicableTier(tenantId, tierId)) {
    throw new ValidationError("Loyalty tier does not belong to this tenant or its organization");
  }
}

export const loyaltyService = {
  async listTiers(auth: AuthContext) {
    requirePermission(auth, "menu:read");
    return loyaltyRepository.listApplicableTiers(auth.tenantId);
  },
  async createTier(auth: AuthContext, input: LoyaltyTierInput) {
    requirePermission(auth, "menu:update");
    const row = await loyaltyRepository.createTier({ tenantId: auth.tenantId, ...normalizedTier(input) });
    await writeAudit({ tenantId: auth.tenantId, userId: auth.userId, branchId: auth.branchId, requestId: auth.requestId, ipAddress: auth.ipAddress, action: "LOYALTY_TIER_CREATED", entity: "customer_loyalty_tier", entityId: row.id, metadata: { name: row.name } });
    return row;
  },
  async updateTier(auth: AuthContext, id: string, patch: Partial<LoyaltyTierInput>) {
    requirePermission(auth, "menu:update");
    const existing = await loyaltyRepository.findTier(auth.tenantId, id);
    if (!existing) throw new NotFoundError("Loyalty tier not found");
    const merged: LoyaltyTierInput = {
      name: patch.name ?? existing.name,
      ...(patch.discountPercent !== undefined ? { discountPercent: patch.discountPercent } : existing.discountPercent !== null ? { discountPercent: Number(existing.discountPercent) } : {}),
      ...(patch.discountFixed !== undefined ? { discountFixed: patch.discountFixed } : existing.discountFixed !== null ? { discountFixed: Number(existing.discountFixed) } : {}),
    };
    const row = await loyaltyRepository.updateTier(auth.tenantId, id, normalizedTier(merged));
    if (!row) throw new NotFoundError("Loyalty tier not found");
    await writeAudit({ tenantId: auth.tenantId, userId: auth.userId, branchId: auth.branchId, requestId: auth.requestId, ipAddress: auth.ipAddress, action: "LOYALTY_TIER_UPDATED", entity: "customer_loyalty_tier", entityId: id });
    return row;
  },
  async removeTier(auth: AuthContext, id: string) {
    requirePermission(auth, "menu:update");
    await loyaltyRepository.removeTier(auth.tenantId, id);
    await writeAudit({ tenantId: auth.tenantId, userId: auth.userId, branchId: auth.branchId, requestId: auth.requestId, ipAddress: auth.ipAddress, action: "LOYALTY_TIER_DELETED", entity: "customer_loyalty_tier", entityId: id });
  },
  async listCustomers(auth: AuthContext) {
    requirePermission(auth, "menu:read");
    return loyaltyRepository.listCustomers(auth.tenantId);
  },
  async createCustomer(auth: AuthContext, input: CustomerInput) {
    requirePermission(auth, "menu:update");
    await assertTierTenant(auth.tenantId, input.loyaltyTierId);
    const phone = input.phone?.trim() || null;
    const existingIdentity = phone
      ? await loyaltyRepository.findOrganizationCustomerIdentity(auth.tenantId, phone)
      : null;
    let row = await loyaltyRepository.createCustomer({
      tenantId: auth.tenantId,
      name: input.name.trim(),
      email: input.email?.trim() || null,
      phone,
      loyaltyTierId: input.loyaltyTierId ?? null,
      organizationCustomerId: existingIdentity,
    });
    if (phone && !existingIdentity) {
      row = (await loyaltyRepository.setOrganizationCustomerIdentity(
        auth.tenantId,
        row.id,
        row.id,
      )) ?? row;
    }
    await writeAudit({ tenantId: auth.tenantId, userId: auth.userId, branchId: auth.branchId, requestId: auth.requestId, ipAddress: auth.ipAddress, action: "CUSTOMER_CREATED", entity: "customer", entityId: row.id });
    return row;
  },
  async updateCustomer(auth: AuthContext, id: string, patch: Partial<CustomerInput>) {
    requirePermission(auth, "menu:update");
    const existing = await loyaltyRepository.findCustomer(auth.tenantId, id);
    if (!existing) throw new NotFoundError("Customer not found");
    if (patch.loyaltyTierId !== undefined) await assertTierTenant(auth.tenantId, patch.loyaltyTierId);
    const normalizedPhone = patch.phone !== undefined ? patch.phone?.trim() || null : existing.phone;
    const organizationCustomerId = normalizedPhone
      ? (await loyaltyRepository.findOrganizationCustomerIdentity(auth.tenantId, normalizedPhone)) ?? existing.organizationCustomerId ?? existing.id
      : null;
    const row = await loyaltyRepository.updateCustomer(auth.tenantId, id, {
      ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
      ...(patch.email !== undefined ? { email: patch.email?.trim() || null } : {}),
      ...(patch.phone !== undefined ? { phone: normalizedPhone } : {}),
      ...(patch.phone !== undefined ? { organizationCustomerId } : {}),
      ...(patch.loyaltyTierId !== undefined ? { loyaltyTierId: patch.loyaltyTierId } : {}),
    });
    if (!row) throw new NotFoundError("Customer not found");
    await writeAudit({ tenantId: auth.tenantId, userId: auth.userId, branchId: auth.branchId, requestId: auth.requestId, ipAddress: auth.ipAddress, action: "CUSTOMER_LOYALTY_UPDATED", entity: "customer", entityId: id, metadata: { loyaltyTierId: patch.loyaltyTierId } });
    return row;
  },
};
