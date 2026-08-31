import { beforeEach, describe, expect, it } from "vitest";
import {
  clearTokens,
  getToken,
  getWaiterName,
  logout,
  saveContext,
  saveProfile,
  saveTokens,
} from "@/features/auth/storage";

beforeEach(() => localStorage.clear());

describe("waiter auth storage", () => {
  it("saves and reads tokens and context", () => {
    saveTokens("access");
    saveContext("tenant-1", "branch-1");
    expect(getToken()).toBe("access");
    expect(localStorage.getItem("waiter_tenant")).toBe("tenant-1");
    expect(localStorage.getItem("waiter_branch")).toBe("branch-1");
  });

  it("removes an existing branch when context has no branch", () => {
    saveContext("tenant-1", "branch-1");
    saveContext("tenant-2", null);
    expect(localStorage.getItem("waiter_tenant")).toBe("tenant-2");
    expect(localStorage.getItem("waiter_branch")).toBeNull();
  });

  it("stores profile display name and clears all waiter state", () => {
    saveProfile({ firstName: "Asha", lastName: "Singh" } as any);
    expect(getWaiterName()).toBe("Asha Singh");
    saveTokens("a");
    logout();
    expect(localStorage.length).toBe(0);
    expect(getWaiterName()).toBe("Waiter");
  });

  it("clearTokens clears authentication and tenant context", () => {
    saveTokens("a");
    saveContext("t", "b");
    clearTokens();
    expect(localStorage.length).toBe(0);
  });
});
