import { describe, expect, it } from "vitest";
import { STORAGE_KEYS } from "@/shared/constants/storage-keys";
describe("storage keys", () =>
  it("uses kds namespace", () => {
    expect(Object.values(STORAGE_KEYS)).toEqual([
      "kds_token",
      "kds_branch",
      "kds_tenant",
    ]);
  }));
