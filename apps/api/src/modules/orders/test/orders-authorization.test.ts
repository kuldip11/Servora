import { describe, expect, it } from 'vitest';
import { assertOrderListScope, assertOrderResourceAccess, requireOrdersPermission } from '../orders-authorization';

const auth = (overrides: any = {}) => ({ userId: 'u1', tenantId: 't1', branchId: 'b1', email: 'u@example.com', roles: [], permissions: [], ...overrides });

describe('orders authorization', () => {
  it('requires permissions', () => {
    expect(() => requireOrdersPermission(auth({ permissions: ['orders:read'] }), 'orders:read')).not.toThrow();
    expect(() => requireOrdersPermission(auth(), 'orders:read')).toThrow('Insufficient permissions');
  });
  it('supports tenant-wide access with an optional branch narrowing', () => {
    expect(() => assertOrderResourceAccess(auth({ tenantWide: true, branchId: null }), 'b9')).not.toThrow();
    expect(() => assertOrderResourceAccess(auth({ tenantWide: true }), 'b1')).not.toThrow();
    expect(() => assertOrderResourceAccess(auth({ tenantWide: true }), 'b2')).toThrow('Order branch access denied');
  });
  it('requires an exact selected branch for branch-scoped users', () => {
    expect(() => assertOrderResourceAccess(auth(), 'b1')).not.toThrow();
    expect(() => assertOrderResourceAccess(auth(), 'b2')).toThrow('Order branch access denied');
    expect(() => assertOrderResourceAccess(auth({ branchId: null }), 'b1')).toThrow('Order branch access denied');
    expect(() => assertOrderListScope(auth({ branchId: null, tenantWide: false }))).toThrow('Order branch access denied');
    expect(() => assertOrderListScope(auth({ branchId: null, tenantWide: true }))).not.toThrow();
  });
});
