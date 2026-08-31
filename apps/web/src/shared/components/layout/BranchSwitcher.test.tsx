import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const { setContext, useAuthStore, useBranches } = vi.hoisted(() => ({
  setContext: vi.fn(),
  useAuthStore: vi.fn(),
  useBranches: vi.fn(),
}));
vi.mock("../../../store/auth", () => ({ useAuthStore: () => useAuthStore() }));
vi.mock("../../../features/branches/hooks/useBranches", () => ({
  useBranches: () => useBranches(),
}));

import { BranchSwitcher } from "./BranchSwitcher";

const membership = {
  membershipId: "m1",
  tenant: { id: "t1", name: "Demo" },
  roles: [{ scope: "TENANT" }],
  branches: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.mockReturnValue({
    memberships: [membership],
    membershipId: "m1",
    branchId: null,
    setContext,
  });
  useBranches.mockReturnValue({
    data: [
      { id: "b1", name: "Main", isActive: true },
      { id: "b2", name: "Second", isActive: true },
    ],
  });
});

describe("BranchSwitcher", () => {
  it("shows all tenant branches even when membership has no explicit branch rows", () => {
    render(<BranchSwitcher />);
    fireEvent.click(screen.getByRole("button", { name: /branch/i }));
    expect(screen.getByRole("menuitem", { name: /Main/i })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: /Second/i })).toBeTruthy();
    expect(
      screen.getByRole("menuitem", { name: /All Branches/i }),
    ).toBeTruthy();
  });

  it("changes active branch context", () => {
    render(<BranchSwitcher />);
    fireEvent.click(screen.getByRole("button", { name: /branch/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /Second/i }));
    expect(setContext).toHaveBeenCalledWith({
      membershipId: "m1",
      franchiseId: "t1",
      branchId: "b2",
    });
  });
});
