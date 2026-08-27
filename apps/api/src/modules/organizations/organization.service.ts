import type { AuthContext } from "../../core/auth";
import { ForbiddenError } from "../../core/errors";
import { organizationRepository } from "./organization.repository";
import { organizationNotFound } from "./organization.errors";

export const organizationService = {
  async list(auth: AuthContext) {
    return organizationRepository.findMembershipsByUserId(auth.userId);
  },

  async create(auth: AuthContext, input: { name: string }) {
    if (!auth.roles.includes("OWNER")) {
      throw new ForbiddenError("Only the global Owner can create organizations");
    }
    const result = await organizationRepository.create({
      name: input.name.trim(),
      createdBy: auth.userId,
    });
    return {
      organization: result.organization,
      membershipId: result.membership.id,
    };
  },

  async update(auth: AuthContext, organizationId: string, changes: { name?: string }) {
    const membership = await organizationRepository.findMembership(auth.userId, organizationId);
    if (!membership) throw organizationNotFound(organizationId);
    const updated = await organizationRepository.update(organizationId, {
      ...(changes.name !== undefined ? { name: changes.name.trim() } : {}),
    });
    if (!updated) throw organizationNotFound(organizationId);
    return updated;
  },

  async archive(auth: AuthContext, organizationId: string) {
    const membership = await organizationRepository.findMembership(auth.userId, organizationId);
    if (!membership) throw organizationNotFound(organizationId);
    const updated = await organizationRepository.update(organizationId, { isActive: false });
    if (!updated) throw organizationNotFound(organizationId);
    return updated;
  },
};
