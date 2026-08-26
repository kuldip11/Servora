import { describe, expect, it } from "vitest";
import { STORAGE_KEYS } from "../storage-keys";

describe("waiter storage keys", () => {
  it("keeps the waiter storage namespace stable", () => {
    expect(Object.values(STORAGE_KEYS)).toEqual([
      "waiter_token",
      "waiter_refresh",
      "waiter_name",
      "waiter_tenant",
      "waiter_branch",
    ]);
  });
});
