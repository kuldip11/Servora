import { describe, expect, it } from "vitest";
import { createTenantBody } from "../tenant.validator";

describe("franchise creation contract", () => {
  it("requires organizationId", () => {
    expect(createTenantBody.required).toContain("organizationId");
    expect(createTenantBody.required).toContain("name");
  });
});
