export interface ApprovalValueLine {
  id: string;
  comboGroupId?: string | null;
  itemStatus: string;
  subtotal: string | number;
}

export function isApprovalRequired(value: number, threshold: number | null | undefined) {
  return threshold !== null && threshold !== undefined && value > threshold;
}

export function approvalAdjustmentValue(
  items: ApprovalValueLine[],
  orderItemId: string,
) {
  const target = items.find((item) => item.id === orderItemId);
  if (!target) return 0;
  return items
    .filter((candidate) =>
      target.comboGroupId
        ? candidate.comboGroupId === target.comboGroupId && candidate.itemStatus === "ACTIVE"
        : candidate.id === orderItemId,
    )
    .reduce((sum, candidate) => sum + Number(candidate.subtotal), 0);
}

export function approvalRoleMatches(roleName: string, requiredRole: string) {
  const role = roleName.trim().toLowerCase();
  const required = requiredRole.trim().toLowerCase();
  return role === required || role === "owner" || role === "global owner";
}
