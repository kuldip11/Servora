export type ActiveAuthContext = {
  userId: string;
  membershipId: string;
  tenantId: string;
  branchId?: string | null;
};

export const createActiveAuthContext = (input: {
  userId: string;
  membershipId: string;
  tenantId: string;
  branchId?: string | null;
}): ActiveAuthContext => {
  return {
    userId: input.userId,
    membershipId: input.membershipId,
    tenantId: input.tenantId,
    branchId: input.branchId ?? null,
  };
};
