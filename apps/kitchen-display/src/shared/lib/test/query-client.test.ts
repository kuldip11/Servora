import { describe, expect, it } from "vitest";
import { queryClient } from "@/shared/lib/query-client";
describe("query client", () =>
  it("uses kitchen defaults", () => {
    const d = queryClient.getDefaultOptions();
    expect(d.queries?.staleTime).toBe(30000);
    expect(d.queries?.retry).toBe(2);
    expect(d.mutations?.retry).toBe(false);
  }));
