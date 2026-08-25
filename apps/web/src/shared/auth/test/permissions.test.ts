import { describe, expect, it, vi } from 'vitest';
const store = vi.hoisted(() => vi.fn());
vi.mock('../../../store/auth', () => ({ useAuthStore: store }));
import { getUserPermissions, userHasPermission } from '../permissions';
describe('permissions', () => {
  it('collects unique permission keys across roles', () => { const user = { roles: [{ permissions: [{ key: 'orders.read' }, { key: 'orders.write' }] }, { permissions: [{ key: 'orders.read' }] }] } as any; expect([...getUserPermissions(user)]).toEqual(['orders.read', 'orders.write']); });
  it('handles users without roles and checks permissions', () => { expect(getUserPermissions(null)).toEqual(new Set()); const user = { roles: [{ permissions: [{ key: 'menu.edit' }] }] } as any; expect(userHasPermission(user, 'menu.edit')).toBe(true); expect(userHasPermission(user, 'menu.delete')).toBe(false); });
});
