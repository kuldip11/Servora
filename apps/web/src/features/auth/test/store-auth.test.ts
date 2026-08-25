import { describe, expect, it, beforeEach } from 'vitest';
import { useAuthStore, REFRESH_TOKEN_KEY } from '../../../store/auth';

const user = { id: 'u1', email: 'user@example.com', name: 'User', tenantId: 'fr-1', branchId: 'br-1' } as any;

beforeEach(() => {
  localStorage.clear();
  useAuthStore.getState().logout();
});

describe('auth store', () => {
  it('hydrates auth and persists the refresh token', () => {
    useAuthStore.getState().setAuth({ user, accessToken: 'access-1', refreshToken: 'refresh-1', membershipId: 'm1', memberships: [] });
    expect(useAuthStore.getState()).toMatchObject({ user, accessToken: 'access-1', refreshToken: 'refresh-1', membershipId: 'm1', franchiseId: 'fr-1', branchId: 'br-1', isAuthenticated: true });
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe('refresh-1');
  });

  it('updates tokens and context without losing existing state', () => {
    useAuthStore.getState().setTokens('a', 'r');
    useAuthStore.getState().setContext({ membershipId: 'm2', franchiseId: 'fr-2', branchId: 'br-2' });
    useAuthStore.getState().setBranchId('br-3');
    expect(useAuthStore.getState()).toMatchObject({ accessToken: 'a', refreshToken: 'r', membershipId: 'm2', franchiseId: 'fr-2', branchId: 'br-3', isAuthenticated: true });
  });

  it('logs out and removes the persisted refresh token', () => {
    useAuthStore.getState().setTokens('a', 'r');
    useAuthStore.getState().logout();
    expect(useAuthStore.getState()).toMatchObject({ user: null, accessToken: null, refreshToken: null, memberships: [], franchiseId: null, branchId: null, isAuthenticated: false });
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
  });
});
