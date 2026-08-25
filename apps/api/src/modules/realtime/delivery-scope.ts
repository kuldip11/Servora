/**
 * Determines whether a realtime event scoped to a tenant/branch may be sent
 * to a socket that is already authorized for that tenant.
 *
 * A null/undefined socket branch represents tenant-wide access. Branch-scoped
 * sockets must receive only events carrying their exact branch id.
 */
export function shouldDeliverRealtimeEvent(
  socketBranchId: string | null | undefined,
  eventBranchId: string | null | undefined,
): boolean {
  if (!socketBranchId) return true;
  return eventBranchId === socketBranchId;
}
