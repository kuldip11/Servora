import { describe, expect, it } from "vitest";
import { DURATIONS, EASINGS, REDUCED_MOTION_QUERY } from "../tokens";

describe("animation tokens", () => {
  it("exposes non-empty duration and easing tokens", () => {
    expect(
      Object.values(DURATIONS).every(
        (value) => Number.isFinite(value) && value > 0,
      ),
    ).toBe(true);
    expect(Object.values(EASINGS).every((value) => value.length > 0)).toBe(
      true,
    );
  });
  it("exposes the standard reduced-motion query", () => {
    expect(REDUCED_MOTION_QUERY).toBe("(prefers-reduced-motion: reduce)");
  });
});
