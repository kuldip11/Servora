import { describe, expect, it, vi } from "vitest";

vi.mock("../../../store/auth", () => ({
  useAuthStore: { getState: () => ({ franchiseId: "fr-1", branchId: "br-1" }) },
}));

import { branchKeys } from "@/features/branches/query-keys";

describe("branchKeys", () => {
  it("keeps all keys under the branches namespace", () => {
    expect(branchKeys.all).toEqual(["branches"]);
  });

  it("scopes lists to the active franchise", () => {
    expect(branchKeys.list()).toEqual([
      "branches",
      "franchise",
      "fr-1",
      "list",
    ]);
  });
});
