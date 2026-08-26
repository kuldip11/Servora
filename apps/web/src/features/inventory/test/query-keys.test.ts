import { describe, expect, it, vi } from "vitest";

vi.mock("../../../store/auth", () => ({
  useAuthStore: { getState: () => ({ franchiseId: "fr-1", branchId: "br-1" }) },
}));

import { inventoryKeys } from "../query-keys";

describe("inventoryKeys", () => {
  it("uses the inventory namespace and branch context", () => {
    expect(inventoryKeys.all).toEqual(["inventory"]);
    expect(inventoryKeys.items()).toEqual([
      "inventory",
      "branch-context",
      "fr-1",
      "br-1",
      "items",
    ]);
  });
});
