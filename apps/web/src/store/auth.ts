import { create } from "zustand";
import type { AvailableMembership, User } from "@pos/types";

const REFRESH_TOKEN_KEY = "pos-refresh-token";

function readRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

function writeRefreshToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
  else window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * Authentication/session state.
 *
 * Access tokens are memory-only. The only authentication value persisted by
 * this store is the refresh token. Server state (franchises, branches,
 * orders, etc.) belongs in TanStack Query, not localStorage/Zustand.
 */
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  /** Internal server access record for the active franchise. Not persisted. */
  membershipId: string | null;
  memberships: AvailableMembership[];
  franchiseId: string | null;
  branchId: string | null;
  isAuthenticated: boolean;

  setAuth: (data: {
    user: User;
    accessToken: string;
    refreshToken: string;
    membershipId?: string | null;
    memberships?: AvailableMembership[];
  }) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setContext: (data: {
    membershipId: string | null;
    franchiseId: string | null;
    memberships?: AvailableMembership[];
    branchId?: string | null;
    user?: User | null;
  }) => void;
  setBranchId: (branchId: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: readRefreshToken(),
  membershipId: null,
  memberships: [],
  franchiseId: null,
  branchId: null,
  isAuthenticated: false,

  setAuth: ({
    user,
    accessToken,
    refreshToken,
    membershipId = null,
    memberships = [],
  }) => {
    writeRefreshToken(refreshToken);
    set({
      user,
      accessToken,
      refreshToken,
      membershipId,
      memberships,
      franchiseId: user.tenantId ?? null,
      branchId: user.branchId ?? null,
      isAuthenticated: true,
    });
  },

  setContext: ({ membershipId, franchiseId, memberships, branchId, user }) =>
    set((state) => ({
      membershipId,
      franchiseId,
      ...(memberships !== undefined ? { memberships } : {}),
      branchId: branchId ?? null,
      ...(user !== undefined ? { user } : {}),
      isAuthenticated: state.isAuthenticated || Boolean(state.accessToken),
    })),

  setTokens: (accessToken, refreshToken) => {
    writeRefreshToken(refreshToken);
    set({ accessToken, refreshToken, isAuthenticated: true });
  },

  setBranchId: (branchId) => set({ branchId }),

  logout: () => {
    writeRefreshToken(null);
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      membershipId: null,
      memberships: [],
      franchiseId: null,
      branchId: null,
      isAuthenticated: false,
    });
  },
}));

export { REFRESH_TOKEN_KEY };
