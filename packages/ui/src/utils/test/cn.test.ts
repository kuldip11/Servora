import { describe, expect, it } from "vitest";
import { cn } from "../cn";

describe("cn", () => {
  it("merges conditional and conflicting Tailwind classes", () => {
    expect(cn("px-2", false && "text-red-500", "px-4")).toBe("px-4");
    expect(cn("font-medium", undefined, "text-sm")).toContain("font-medium");
  });
});
