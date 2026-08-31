

export function shouldDeliverRealtimeEvent(
  socketBranchId: string | null | undefined,
  eventBranchId: string | null | undefined,
): boolean {
  if (!socketBranchId) return true;
  return eventBranchId === socketBranchId;
}
