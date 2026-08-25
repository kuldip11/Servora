import { describe, expect, it } from "vitest";
import { Value } from "@sinclair/typebox/value";
import * as mod from "../bulk-ops.validator";

describe("bulk-ops.validator validators", () => {
  it("exports TypeBox schemas that reject an empty payload", () => {
    const schemas = Object.entries(mod).filter(
      ([k, v]) => k !== "default" && v && typeof v === "object",
    );
    expect(schemas.length).toBeGreaterThan(0);
    for (const [, schema] of schemas)
      expect(Value.Check(schema as any, {})).toBe(false);
  });
});
