import { describe, expect, it } from "vitest";
import { STORAGE_KEYS } from "@/shared/constants/storage-keys";

describe("waiter storage keys", () => {
  it("persists waiter context but never the access token", () => {
    expect(Object.values(STORAGE_KEYS)).toEqual([
      "waiter_name",
      "waiter_tenant",
      "waiter_branch",
      "waiter_permissions",
    ]);
    expect(Object.values(STORAGE_KEYS)).not.toContain("waiter_token");
  });
});
