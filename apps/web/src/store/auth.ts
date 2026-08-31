import { create } from "zustand";
import type { AvailableMembership, User } from "@pos/types";

interface AuthState {
  user: User | null;
  accessToken: string | null;

  membershipId: string | null;
  organizationId: string | null;
  memberships: AvailableMembership[];
  franchiseId: string | null;
  branchId: string | null;
  isAuthenticated: boolean;

  setAuth: (data: {
    user: User;
    accessToken: string;
    membershipId?: string | null;
    memberships?: AvailableMembership[];
  }) => void;
  setAccessToken: (accessToken: string) => void;
  setContext: (data: {
    membershipId: string | null;
    organizationId?: string | null;
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
  membershipId: null,
  organizationId: null,
  memberships: [],
  franchiseId: null,
  branchId: null,
  isAuthenticated: false,

  setAuth: ({
    user,
    accessToken,
    membershipId = null,
    memberships = [],
  }) => {
    set({
      user,
      accessToken,
      membershipId,
      organizationId: null,
      memberships,
      franchiseId: user.tenantId ?? null,
      branchId: user.branchId ?? null,
      isAuthenticated: true,
    });
  },

  setContext: ({
    membershipId,
    organizationId,
    franchiseId,
    memberships,
    branchId,
    user,
  }) =>
    set((state) => ({
      membershipId,
      ...(organizationId !== undefined ? { organizationId } : {}),
      franchiseId,
      ...(memberships !== undefined ? { memberships } : {}),
      branchId: branchId ?? null,
      ...(user !== undefined ? { user } : {}),
      isAuthenticated: state.isAuthenticated || Boolean(state.accessToken),
    })),

  setAccessToken: (accessToken) => {
    set({ accessToken, isAuthenticated: true });
  },

  setBranchId: (branchId) => set({ branchId }),

  logout: () => {
    set({
      user: null,
      accessToken: null,
      membershipId: null,
      organizationId: null,
      memberships: [],
      franchiseId: null,
      branchId: null,
      isAuthenticated: false,
    });
  },
}));

