import { describe, expect, it } from "vitest";
import { classifyMenuEngineering } from "../analytics.service";

describe("H3 menu engineering", () => {
  it.each([
    [80, 50, "STAR"],
    [80, 5, "PUZZLE"],
    [20, 50, "PLOWHORSE"],
    [20, 5, "DOG"],
  ] as const)(
    "classifies margin %s and volume %s as %s",
    (margin, volume, expected) => {
      expect(classifyMenuEngineering(margin, volume, 50, 25)).toBe(expected);
    },
  );
});
