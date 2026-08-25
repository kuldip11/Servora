import type { AuthContext } from '../../core/auth';
import { ForbiddenError } from '../../core/errors';

export function requireOrdersPermission(auth: AuthContext, permission: string): void {
  if (!auth.permissions.includes(permission)) {
    throw new ForbiddenError('Insufficient permissions', { required: permission });
  }
}

/**
 * Orders are branch-owned resources. Tenant-wide memberships may access any
 * branch in their active tenant, while a selected branch narrows even a
 * tenant-wide membership to that branch for request-scoped operations.
 */
export function assertOrderResourceAccess(auth: AuthContext, orderBranchId: string): void {
  if (auth.tenantWide) {
    if (auth.branchId && auth.branchId !== orderBranchId) {
      throw new ForbiddenError('Order branch access denied');
    }
    return;
  }

  if (!auth.branchId || auth.branchId !== orderBranchId) {
    throw new ForbiddenError('Order branch access denied');
  }
}

export function assertOrderListScope(auth: AuthContext): void {
  if (!auth.tenantWide && !auth.branchId) {
    throw new ForbiddenError('Order branch access denied');
  }
}
