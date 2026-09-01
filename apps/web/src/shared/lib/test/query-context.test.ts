import { describe, expect, it, vi } from "vitest";
const getState = vi.hoisted(() => vi.fn());
vi.mock("../../../store/auth", () => ({ useAuthStore: { getState } }));
import {
  activeBranchId,
  activeFranchiseId,
  branchQueryContextKey,
  franchiseQueryContextKey,
} from "@/shared/lib/query-context";
describe("query context", () => {
  it("builds cache identities from auth state", () => {
    getState.mockReturnValue({ franchiseId: "fr1", branchId: "br1" });
    expect(franchiseQueryContextKey()).toEqual(["franchise", "fr1"]);
    expect(branchQueryContextKey()).toEqual(["branch-context", "fr1", "br1"]);
    expect(activeFranchiseId()).toBe("fr1");
    expect(activeBranchId()).toBe("br1");
  });
});
