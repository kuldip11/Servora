import type { AuthContext } from '../../core/auth';
import { requirePermission } from '../../core/auth';
import { ForbiddenError } from '../../core/errors';

export type AnalyticsPermission = 'analytics:read';

export function requireAnalyticsPermission(auth: AuthContext, permission: AnalyticsPermission): void {
  requirePermission(auth, permission);
}

/** Analytics is tenant-scoped, with an optional branch filter. Only tenant-wide
 * memberships may request an all-branches aggregate. */
export function assertAnalyticsScope(auth: AuthContext): void {
  if (!auth.tenantWide && !auth.branchId) {
    throw new ForbiddenError('Insufficient permissions');
  }
}
