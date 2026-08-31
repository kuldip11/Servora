import { describe, expect, it } from "vitest";
import { Value } from "@sinclair/typebox/value";
import * as mod from "@/modules/menu/templates/templates.validator";

describe("templates.test validator validators", () => {
  it("exports TypeBox schemas with required-field validation", () => {
    const schemas = Object.entries(mod).filter(
      ([k, v]) => k !== "default" && v && typeof v === "object",
    );
    expect(schemas.length).toBeGreaterThan(0);
    expect(schemas.some(([, schema]) => !Value.Check(schema as any, {}))).toBe(
      true,
    );
  });
});
