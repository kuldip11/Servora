import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock('../../../../shared/lib/api-client', () => ({ apiClient: api }));
import { authService } from '../auth.service';

const user = { id: 'u1', tenantId: 't1', branchId: 'b1' } as any;

describe('authService', () => {
  beforeEach(() => {
    api.get.mockReset(); api.post.mockReset();
    localStorage.clear();
  });

  it('signs up and returns the user payload', async () => {
    api.post.mockResolvedValue({ data: { data: { user } } });
    await expect(authService.signup({ firstName: 'A', lastName: 'B', email: 'a@b.com', password: 'secret' })).resolves.toEqual({ user });
    expect(api.post).toHaveBeenCalledWith('/auth/signup', { firstName: 'A', lastName: 'B', email: 'a@b.com', password: 'secret' });
  });

  it('logs in', async () => {
    const data = { accessToken: 'a', refreshToken: 'r', expiresIn: 60, user };
    api.post.mockResolvedValue({ data: { data } });
    await expect(authService.login({ email: 'a@b.com', password: 'secret' })).resolves.toEqual(data);
  });

  it('refreshes using the persisted refresh token', async () => {
    localStorage.setItem('pos-refresh-token', 'r1');
    const data = { accessToken: 'a2', refreshToken: 'r2', expiresIn: 60, user };
    api.post.mockResolvedValue({ data: { data } });
    await expect(authService.refresh()).resolves.toEqual(data);
    expect(api.post).toHaveBeenCalledWith('/auth/refresh', { refreshToken: 'r1' });
  });

  it('rejects refresh when no refresh token exists', async () => {
    await expect(authService.refresh()).rejects.toThrow('No refresh token available');
    expect(api.post).not.toHaveBeenCalled();
  });

  it('loads memberships, creates a tenant, and loads the current user', async () => {
    api.get.mockImplementation((url: string) => {
      if (url === '/auth/memberships') return Promise.resolve({ data: { data: ['m1'] } });
      return Promise.resolve({ data: { data: user } });
    });
    api.post.mockResolvedValue({ data: { data: { tenant: { id: 't1', name: 'Tenant' }, membershipId: 'm1' } } });
    await expect(authService.memberships()).resolves.toEqual(['m1']);
    await expect(authService.createTenant('Tenant')).resolves.toEqual({ tenant: { id: 't1', name: 'Tenant' }, membershipId: 'm1' });
    await expect(authService.me()).resolves.toEqual(user);
    expect(api.post).toHaveBeenCalledWith('/tenants', { name: 'Tenant' });
    expect(api.get).toHaveBeenCalledWith('/auth/me');
  });
});
