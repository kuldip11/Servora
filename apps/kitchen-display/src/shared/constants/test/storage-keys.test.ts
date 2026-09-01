import { describe, expect, it } from "vitest";
import { STORAGE_KEYS } from "@/shared/constants/storage-keys";

describe("storage keys", () =>
  it("persists only KDS context and never the access token", () => {
    expect(Object.values(STORAGE_KEYS)).toEqual(["kds_branch", "kds_tenant"]);
    expect(Object.values(STORAGE_KEYS)).not.toContain("kds_token");
  }));
