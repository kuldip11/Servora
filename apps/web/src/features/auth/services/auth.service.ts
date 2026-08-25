import { apiClient } from '../../../shared/lib/api-client';
import type { AvailableMembership, User } from '@pos/types';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export const authService = {
  async signup(data: {
    tenantName?: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) {
    const res = await apiClient.post('/auth/signup', data);
    return res.data.data as { user: User };
  },

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    const res = await apiClient.post('/auth/login', data);
    return res.data.data;
  },

  async refresh(): Promise<AuthResponse> {
    const refreshToken = useRefreshToken();
    if (!refreshToken) throw new Error('No refresh token available');
    const res = await apiClient.post('/auth/refresh', { refreshToken });
    return res.data.data;
  },

  async memberships(): Promise<AvailableMembership[]> {
    const res = await apiClient.get('/auth/memberships');
    return res.data.data;
  },

  async createTenant(name: string) {
    const res = await apiClient.post('/tenants', { name });
    return res.data.data as { tenant: { id: string; name: string }; membershipId: string };
  },

  async me(): Promise<User> {
    const res = await apiClient.get('/auth/me');
    return res.data.data;
  },
};

function useRefreshToken(): string | null {
  return typeof window === 'undefined' ? null : window.localStorage.getItem('pos-refresh-token');
}
