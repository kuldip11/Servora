export interface ApprovalValueLine {
  id: string;
  comboGroupId?: string | null;
  itemStatus: string;
  subtotal: string | number;
}

/** H6 boundary is deliberately strict: exactly at the threshold is allowed. */
export function isApprovalRequired(value: number, threshold: number | null | undefined) {
  return threshold !== null && threshold !== undefined && value > threshold;
}

/**
 * Void/comp acts on the complete combo group when a component is selected.
 * Approval must therefore evaluate the exact same affected set, otherwise a
 * cheap component can be used to bypass a threshold on an expensive combo.
 */
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
