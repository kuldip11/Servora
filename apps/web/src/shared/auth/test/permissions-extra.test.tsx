import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';

const auth = vi.hoisted(() => ({ user: null as any }));
vi.mock('../../../store/auth', () => ({
  useAuthStore: (selector: (state: typeof auth) => unknown) => selector(auth),
}));

import { getUserPermissions, userHasPermission, usePermissions } from '../permissions';

function renderPermissions() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  let value!: ReturnType<typeof usePermissions>;
  function Probe() { value = usePermissions(); return null; }
  const root = createRoot(container);
  act(() => root.render(createElement(Probe)));
  return { value, unmount: () => act(() => root.unmount()) };
}

describe('permission helpers', () => {
  it('deduplicates role permissions and handles a missing user', () => {
    expect([...getUserPermissions(null)]).toEqual([]);
    const user = { roles: [{ permissions: [{ key: 'orders:read' }, { key: 'orders:write' }] }, { permissions: [{ key: 'orders:read' }] }] };
    expect([...getUserPermissions(user as any)]).toEqual(['orders:read', 'orders:write']);
    expect(userHasPermission(user as any, 'orders:write')).toBe(true);
    expect(userHasPermission(user as any, 'billing:read')).toBe(false);
  });

  it('exposes has, hasAny, and hasAll for the active user', () => {
    auth.user = { roles: [{ permissions: [{ key: 'orders:read' }, { key: 'billing:read' }] }] };
    const { value, unmount } = renderPermissions();
    expect(value.has('orders:read')).toBe(true);
    expect(value.hasAny(['missing', 'billing:read'])).toBe(true);
    expect(value.hasAll(['orders:read', 'billing:read'])).toBe(true);
    expect(value.hasAll(['orders:read', 'missing'])).toBe(false);
    unmount();
  });
});
