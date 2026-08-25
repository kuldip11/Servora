import { describe, expect, it, vi } from "vitest";

const list = vi.hoisted(() => vi.fn());
vi.mock("../services/tables.service", () => ({
  tablesService: { list },
}));
vi.mock("../../../store/auth", () => ({
  useAuthStore: { getState: () => ({ franchiseId: "fr-1", branchId: "br-1" }) },
}));

import { tablesQuery } from "../query-options";

describe("tablesQuery", () => {
  it("binds the table key to the table service", () => {
    const query = tablesQuery();
    expect(query.queryKey).toEqual([
      "tables",
      "branch-context",
      "fr-1",
      "br-1",
      "list",
    ]);
    expect(query.queryFn).toBe(list);
  });
});
