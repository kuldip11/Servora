import { describe, expect, it } from "vitest";
import { createActiveAuthContext } from "@/core/auth/membership-session";

describe("createActiveAuthContext", () => {
  it("creates an active context and defaults an omitted branch to null", () => {
    expect(
      createActiveAuthContext({
        userId: "u",
        membershipId: "m",
        tenantId: "t",
      }),
    ).toEqual({
      userId: "u",
      membershipId: "m",
      tenantId: "t",
      branchId: null,
    });
  });
  it("preserves an explicitly selected branch", () => {
    expect(
      createActiveAuthContext({
        userId: "u",
        membershipId: "m",
        tenantId: "t",
        branchId: "b",
      }).branchId,
    ).toBe("b");
  });
});
