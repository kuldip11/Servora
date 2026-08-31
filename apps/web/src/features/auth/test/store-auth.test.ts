import { describe, expect, it, beforeEach } from "vitest";
import { useAuthStore } from "../../../store/auth";

const user = {
  id: "u1",
  email: "user@example.com",
  name: "User",
  tenantId: "fr-1",
  branchId: "br-1",
} as any;

beforeEach(() => {
  localStorage.clear();
  useAuthStore.getState().logout();
});

describe("auth store", () => {
  it("hydrates auth without persisting a refresh token", () => {
    useAuthStore.getState().setAuth({
      user,
      accessToken: "access-1",
      membershipId: "m1",
      memberships: [],
    });
    expect(useAuthStore.getState()).toMatchObject({
      user,
      accessToken: "access-1",
      membershipId: "m1",
      franchiseId: "fr-1",
      branchId: "br-1",
      isAuthenticated: true,
    });
    expect(localStorage.getItem("pos-refresh-token")).toBeNull();
  });

  it("updates the access token and context without losing existing state", () => {
    useAuthStore.getState().setAccessToken("a");
    useAuthStore.getState().setContext({
      membershipId: "m2",
      franchiseId: "fr-2",
      branchId: "br-2",
    });
    useAuthStore.getState().setBranchId("br-3");
    expect(useAuthStore.getState()).toMatchObject({
      accessToken: "a",
      membershipId: "m2",
      franchiseId: "fr-2",
      branchId: "br-3",
      isAuthenticated: true,
    });
  });

  it("clears in-memory authentication on logout", () => {
    useAuthStore.getState().setAccessToken("a");
    useAuthStore.getState().logout();
    expect(useAuthStore.getState()).toMatchObject({
      user: null,
      accessToken: null,
      memberships: [],
      franchiseId: null,
      branchId: null,
      isAuthenticated: false,
    });
  });
});
