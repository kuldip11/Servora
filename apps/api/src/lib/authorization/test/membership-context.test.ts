import { describe, expect, it, vi } from 'vitest';
import { listUserMemberships, resolveActiveBranch } from '../membership-context';

const activeMembership = {
  id: 'm1',
  tenantId: 't1',
  tenant: { id: 't1', name: 'Restaurant' },
  roles: [{ roleId: 'r1', role: { name: 'MANAGER', scope: 'TENANT' } }],
  branches: [{ branchId: 'b1', branch: { id: 'b1', name: 'Main', address: 'Street', isActive: true, tablesEnabled: true } }],
  status: 'ACTIVE',
};

describe('membership context', () => {
  it('lists active memberships and global-owner status', async () => {
    const db = {
      query: {
        tenantMemberships: { findMany: vi.fn().mockResolvedValue([activeMembership]) },
        users: { findFirst: vi.fn().mockResolvedValue({ globalUserRoles: [{ role: { name: 'OWNER', scope: 'GLOBAL' } }] }) },
      },
    };
    await expect(listUserMemberships(db, 'u1')).resolves.toEqual([{
      membershipId: 'm1',
      isGlobalOwner: true,
      tenant: { id: 't1', name: 'Restaurant' },
      roles: [{ id: 'r1', name: 'MANAGER', scope: 'TENANT' }],
      branches: [{ id: 'b1', name: 'Main', address: 'Street', isActive: true, tablesEnabled: true }],
    }]);
  });

  it('rejects a membership that does not match the active context', async () => {
    const db = { query: { tenantMemberships: { findFirst: vi.fn().mockResolvedValue(undefined) }, branches: { findFirst: vi.fn() } } };
    await expect(resolveActiveBranch(db, { userId: 'u1', membershipId: 'other', tenantId: 't1', branchId: null }, 'b1')).rejects.toThrow('Membership access denied');
  });

  it('allows an assigned branch and preserves context', async () => {
    const db = {
      query: {
        tenantMemberships: { findFirst: vi.fn().mockResolvedValue(activeMembership) },
        branches: { findFirst: vi.fn().mockResolvedValue({ id: 'b1', tenantId: 't1' }) },
        globalUserRoles: { findMany: vi.fn().mockResolvedValue([]) },
      },
    };
    await expect(resolveActiveBranch(db, { userId: 'u1', membershipId: 'm1', tenantId: 't1', branchId: null }, 'b1')).resolves.toEqual({ userId: 'u1', membershipId: 'm1', tenantId: 't1', branchId: 'b1' });
  });

  it('rejects a branch not assigned to a branch-scoped membership', async () => {
    const membership = { ...activeMembership, roles: [{ roleId: 'r1', role: { scope: 'BRANCH' } }], branches: [{ branchId: 'other', branch: {} }] };
    const db = {
      query: {
        tenantMemberships: { findFirst: vi.fn().mockResolvedValue(membership) },
        branches: { findFirst: vi.fn().mockResolvedValue({ id: 'b1', tenantId: 't1' }) },
        globalUserRoles: { findMany: vi.fn().mockResolvedValue([]) },
      },
    };
    await expect(resolveActiveBranch(db, { userId: 'u1', membershipId: 'm1', tenantId: 't1', branchId: null }, 'b1')).rejects.toThrow('Membership access denied');
  });
});
