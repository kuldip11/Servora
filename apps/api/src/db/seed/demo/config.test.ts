import { describe, expect, it } from "vitest";
import {
  estimateSeedSizeMb,
  resolvePreset,
  SMALL_PRESET_MAX_MB,
} from "./config";
import { parsePreset } from "./utils";

describe("demo seed presets", () => {
  it("supports exactly the documented small and demo presets", () => {
    expect(parsePreset(["--preset=small"])).toBe("small");
    expect(parsePreset(["--preset=demo"])).toBe("demo");
    expect(() => parsePreset(["--preset=stress"])).toThrow(
      "Expected small or demo",
    );
  });

  it("keeps small below its 250 MB conservative budget", () => {
    const config = resolvePreset("small");
    expect(config.brands).toHaveLength(4);
    expect(config.brands.every((brand) => brand.branchCount === 2)).toBe(true);
    expect(config.estimatedSizeMb).toBe(estimateSeedSizeMb(config));
    expect(config.estimatedSizeMb).toBeLessThanOrEqual(SMALL_PRESET_MAX_MB);
  });

  it("makes demo substantially larger while retaining all concepts", () => {
    const small = resolvePreset("small");
    const demo = resolvePreset("demo");
    expect(demo.brands).toHaveLength(4);
    expect(demo.brands.every((brand) => brand.branchCount === 6)).toBe(true);
    expect(demo.historyDays).toBe(365);
    expect(demo.estimatedSizeMb).toBeGreaterThan(small.estimatedSizeMb * 20);
  });
});
