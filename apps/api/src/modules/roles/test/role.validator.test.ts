import { describe, expect, it } from "vitest";
import { Value } from "@sinclair/typebox/value";
import { createRoleBody } from "../role.validator";

describe("role validator", () => {
  it("accepts tenant and branch custom roles", () => {
    expect(
      Value.Check(createRoleBody, { name: "Shift Lead", scope: "BRANCH" }),
    ).toBe(true);
    expect(
      Value.Check(createRoleBody, { name: "Ops Admin", scope: "TENANT" }),
    ).toBe(true);
  });
  it("does not allow custom global roles", () => {
    expect(
      Value.Check(createRoleBody, { name: "Super", scope: "GLOBAL" }),
    ).toBe(false);
  });
});
