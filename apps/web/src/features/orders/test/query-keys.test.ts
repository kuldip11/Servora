import { describe, expect, it, vi } from "vitest";

vi.mock("../../../store/auth", () => ({
  useAuthStore: { getState: () => ({ franchiseId: "fr-1", branchId: "br-1" }) },
}));

import { orderKeys } from "@/features/orders/query-keys";

describe("orderKeys", () => {
  it("scopes list and detail keys to the active branch context", () => {
    const filters = { status: "OPEN" as const };
    expect(orderKeys.lists()).toEqual([
      "orders",
      "list",
      "branch-context",
      "fr-1",
      "br-1",
    ]);
    expect(orderKeys.list(filters)).toEqual([
      "orders",
      "list",
      "branch-context",
      "fr-1",
      "br-1",
      filters,
    ]);
    expect(orderKeys.details()).toEqual([
      "orders",
      "detail",
      "branch-context",
      "fr-1",
      "br-1",
    ]);
    expect(orderKeys.detail("order-1")).toEqual([
      "orders",
      "detail",
      "branch-context",
      "fr-1",
      "br-1",
      "order-1",
    ]);
  });
});
