import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AxiosError } from 'axios';

import { useAuthStore, REFRESH_TOKEN_KEY } from '../../store/auth';
import { useLocalStorage } from '../../shared/hooks/useLocalStorage';
import { useMediaQuery } from '../../shared/hooks/useMediaQuery';
import { queryClient } from '../../shared/lib/query-client';
import { bootstrapAuthSession } from '../../shared/auth/bootstrap';
import { authService } from '../../features/auth/services/auth.service';

vi.mock('../../features/auth/services/auth.service', () => ({
  authService: { refresh: vi.fn() },
}));

function renderHook<T>(hook: () => T) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  let value!: T;
  function Probe() {
    value = hook();
    return null;
  }
  const root = createRoot(container);
  act(() => root.render(createElement(Probe)));
  return {
    get result() { return value; },
    rerender: () => act(() => root.render(createElement(Probe))),
    unmount: () => act(() => { root.unmount(); container.remove(); }),
  };
}

const user = { id: 'u1', email: 'u@example.com', name: 'Test User', tenantId: 'tenant-1', branchId: 'branch-1' } as any;

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  useAuthStore.getState().logout();
});

describe('core web coverage', () => {
  it('covers auth store lifecycle and persistence', () => {
    localStorage.setItem(REFRESH_TOKEN_KEY, 'persisted');
    useAuthStore.setState({ refreshToken: 'persisted' });

    act(() => useAuthStore.getState().setAuth({
      user,
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      membershipId: 'membership-1',
      memberships: [{ id: 'membership-1' }] as any,
    }));
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().franchiseId).toBe('tenant-1');
    expect(useAuthStore.getState().branchId).toBe('branch-1');
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe('refresh-1');

    act(() => useAuthStore.getState().setContext({
      membershipId: 'membership-2', franchiseId: 'tenant-2', branchId: 'branch-2',
      memberships: [{ id: 'membership-2' }] as any,
    }));
    expect(useAuthStore.getState().membershipId).toBe('membership-2');
    expect(useAuthStore.getState().franchiseId).toBe('tenant-2');

    act(() => useAuthStore.getState().setTokens('access-2', 'refresh-2'));
    act(() => useAuthStore.getState().setBranchId(null));
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe('refresh-2');
    expect(useAuthStore.getState().branchId).toBeNull();

    act(() => useAuthStore.getState().logout());
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
  });

  it('covers local storage missing values, updates, and write failures', () => {
    const hook = renderHook(() => useLocalStorage('core-key', { value: 1 }));
    expect(hook.result[0]).toEqual({ value: 1 });
    act(() => hook.result[1]({ value: 2 }));
    hook.rerender();
    expect(JSON.parse(localStorage.getItem('core-key')!)).toEqual({ value: 2 });

    const original = window.localStorage.setItem;
    Object.defineProperty(window.localStorage, 'setItem', { configurable: true, value: vi.fn(() => { throw new Error('quota'); }) });
    expect(() => hook.rerender()).not.toThrow();
    Object.defineProperty(window.localStorage, 'setItem', { configurable: true, value: original });
    hook.unmount();
  });

  it('covers media query initial true state and cleanup', () => {
    const add = vi.fn();
    const remove = vi.fn();
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: add, removeEventListener: remove })));
    const hook = renderHook(() => useMediaQuery('(prefers-color-scheme: dark)'));
    expect(hook.result).toBe(true);
    expect(add).toHaveBeenCalledWith('change', expect.any(Function));
    hook.unmount();
    expect(remove).toHaveBeenCalledWith('change', expect.any(Function));
    vi.unstubAllGlobals();
  });

  it('covers bootstrap auth with no token, successful refresh, and failed refresh', async () => {
    await bootstrapAuthSession();
    expect(authService.refresh).not.toHaveBeenCalled();

    localStorage.setItem(REFRESH_TOKEN_KEY, 'refresh-bootstrap');
    vi.mocked(authService.refresh).mockResolvedValueOnce({
      user,
      accessToken: 'access-bootstrap',
      refreshToken: 'refresh-bootstrap-2',
    } as any);
    await bootstrapAuthSession();
    expect(authService.refresh).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    vi.mocked(authService.refresh).mockRejectedValueOnce(new Error('expired'));
    await bootstrapAuthSession();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('covers query retry policy branches', () => {
    const retry = queryClient.getDefaultOptions().queries?.retry as (count: number, error: unknown) => boolean;
    const axiosError = (status: number) => new AxiosError('request failed', undefined, undefined, undefined, { status, statusText: '', headers: {}, config: {} as any, data: null });
    expect(retry(0, axiosError(401))).toBe(false);
    expect(retry(0, axiosError(403))).toBe(false);
    expect(retry(0, axiosError(404))).toBe(false);
    expect(retry(0, axiosError(500))).toBe(true);
    expect(retry(1, axiosError(500))).toBe(true);
    expect(retry(2, axiosError(500))).toBe(false);
    expect(retry(0, new Error('network'))).toBe(true);
  });
});
