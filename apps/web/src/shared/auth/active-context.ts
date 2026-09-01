import type { AvailableMembership } from "@pos/types";
import { authService } from "@/features/auth/services/auth.service";
import { useAuthStore } from "@/store/auth";

const defaultBranchForMembership = (
  membership: AvailableMembership,
): string | null => {
  if (membership.roles.some((role) => role.scope === "TENANT")) return null;
  return membership.branches[0]?.id ?? null;
};

export const activateMembershipContext = async (
  membership: AvailableMembership,
  memberships: AvailableMembership[],
  organizationId?: string | null,
): Promise<void> => {
  const branchId = defaultBranchForMembership(membership);
  const store = useAuthStore.getState();

  store.setContext({
    membershipId: membership.membershipId,
    ...(organizationId !== undefined ? { organizationId } : {}),
    franchiseId: membership.tenant.id,
    memberships,
    branchId,
  });

  try {
    const user = await authService.me();
    useAuthStore.getState().setContext({
      membershipId: membership.membershipId,
      ...(organizationId !== undefined ? { organizationId } : {}),
      franchiseId: membership.tenant.id,
      memberships,
      branchId,
      user,
    });
  } catch (error) {
    useAuthStore.getState().setContext({
      membershipId: null,
      franchiseId: null,
      branchId: null,
    });
    throw error;
  }
};
