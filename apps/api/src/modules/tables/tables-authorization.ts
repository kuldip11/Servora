import type { AuthContext } from '../../core/auth';
import { requireBranch, requirePermission } from '../../core/auth';
import { ForbiddenError } from '../../core/errors';

export type TablesPermission =
  | 'tables:read'
  | 'tables:create'
  | 'tables:update'
  | 'tables:delete';

export function requireTablesPermission(auth: AuthContext, permission: TablesPermission): void {
  requirePermission(auth, permission);
}

/** Resolve a concrete table branch while enforcing membership scope. */
export function resolveTableBranch(auth: AuthContext, requestedBranchId?: string | null): string {
  const requested = requestedBranchId ?? auth.branchId ?? undefined;
  if (!requested) {
    return requireBranch(auth, 'Please select a specific branch before accessing tables.');
  }

  if (auth.tenantWide) return requested;

  const active = requireBranch(auth, 'Please select a specific branch before accessing tables.');
  if (requested !== active || !(auth.authorizedBranchIds ?? []).includes(requested)) {
    throw new ForbiddenError('Branch access denied');
  }
  return requested;
}

/** Table rows are branch-owned resources; never trust the row without checking its branch scope. */
export function assertTableResourceAccess(
  auth: AuthContext,
  resourceBranchId: string | null | undefined,
): void {
  if (!resourceBranchId) throw new ForbiddenError('Branch access denied');
  if (auth.tenantWide) return;
  if (!(auth.authorizedBranchIds ?? []).includes(resourceBranchId)) {
    throw new ForbiddenError('Branch access denied');
  }
  if (auth.branchId && auth.branchId !== resourceBranchId) {
    throw new ForbiddenError('Branch access denied');
  }
}

/** Aggregate table listing is tenant-wide only; branch-scoped members need an active branch. */
export function assertTableListScope(auth: AuthContext): void {
  if (!auth.branchId && !auth.tenantWide) {
    throw new ForbiddenError('Branch access denied');
  }
}
