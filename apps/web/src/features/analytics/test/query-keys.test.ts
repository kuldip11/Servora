import { describe, expect, it, vi } from "vitest";

vi.mock("../../../store/auth", () => ({
  useAuthStore: { getState: () => ({ franchiseId: "fr-1", branchId: "br-1" }) },
}));

import { analyticsKeys } from "@/features/analytics/query-keys";

describe("analyticsKeys", () => {
  it("builds a stable root key", () => {
    expect(analyticsKeys.all).toEqual(["analytics"]);
  });

  it("includes the active branch context in dashboard keys", () => {
    expect(analyticsKeys.dashboard()).toEqual([
      "analytics",
      "branch-context",
      "fr-1",
      "br-1",
      "dashboard",
    ]);
  });
});
