import { describe, expect, it } from "vitest";
import {
  assertMenuQueryBranch,
  assertMenuResourceBranch,
  resolveMenuBranch,
} from "../menu-authorization";

const tenantWide: any = {
  tenantWide: true,
  branchId: null,
  authorizedBranchIds: ["b1"],
};
const branchScoped: any = {
  tenantWide: false,
  branchId: "b1",
  authorizedBranchIds: ["b1"],
};
describe("menu authorization", () => {
  it("resolves tenant-wide and branch-scoped branch selection", () => {
    expect(resolveMenuBranch(tenantWide, "b2")).toBe("b2");
    expect(resolveMenuBranch(branchScoped, "b1")).toBe("b1");
    expect(assertMenuQueryBranch(tenantWide)).toBeUndefined();
  });
  it("allows shared resources only when explicitly enabled", () => {
    expect(() => assertMenuResourceBranch(tenantWide, null)).not.toThrow();
    expect(() => assertMenuResourceBranch(branchScoped, null)).toThrow();
    expect(() =>
      assertMenuResourceBranch(branchScoped, null, { allowShared: true }),
    ).not.toThrow();
  });
});
