import { describe, expect, it } from "vitest";
import { queryClient } from "@/shared/lib/query-client";

describe("waiter query client", () => {
  it("uses the documented defaults", () => {
    const defaults = queryClient.getDefaultOptions();
    expect(defaults.queries?.staleTime).toBe(30_000);
    expect(defaults.queries?.retry).toBe(2);
  });
});
