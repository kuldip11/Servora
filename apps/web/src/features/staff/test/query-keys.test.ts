import { describe, expect, it, vi } from "vitest";

vi.mock("../../../store/auth", () => ({
  useAuthStore: { getState: () => ({ franchiseId: "fr-1", branchId: "br-1" }) },
}));

import { roleKeys, staffKeys } from "@/features/staff/query-keys";

describe("staff and role keys", () => {
  it("scopes both resources to the active franchise", () => {
    expect(staffKeys.list()).toEqual(["staff", "franchise", "fr-1", "list"]);
    expect(roleKeys.list()).toEqual(["roles", "franchise", "fr-1", "list"]);
  });
});
