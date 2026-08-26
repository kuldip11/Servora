import { describe, expect, it, vi } from "vitest";

const listStaff = vi.hoisted(() => vi.fn());
const listRoles = vi.hoisted(() => vi.fn());
vi.mock("../services/staff.service", () => ({
  staffService: { list: listStaff },
}));
vi.mock("../services/roles.service", () => ({
  rolesService: { list: listRoles },
}));
vi.mock("../../../store/auth", () => ({
  useAuthStore: { getState: () => ({ franchiseId: "fr-1", branchId: "br-1" }) },
}));

import { rolesListQuery, staffListQuery } from "../query-options";

describe("staff query definitions", () => {
  it("binds staff to the staff service", () => {
    const query = staffListQuery();
    expect(query.queryKey).toEqual(["staff", "franchise", "fr-1", "list"]);
    expect(query.queryFn).toBe(listStaff);
  });

  it("uses a longer freshness window for roles", () => {
    const query = rolesListQuery();
    expect(query.queryKey).toEqual(["roles", "franchise", "fr-1", "list"]);
    expect(query.queryFn).toBe(listRoles);
    expect(query.staleTime).toBe(600_000);
  });
});
